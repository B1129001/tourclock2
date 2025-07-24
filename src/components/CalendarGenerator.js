import React, { useState, useEffect, useRef } from 'react';
import liff from '@line/liff';
import { Download, MapPin, Share2, Copy, Calendar } from 'lucide-react';
import './CalendarGenerator.css';

const CalendarGenerator = () => {
  const [formData, setFormData] = useState({ date: '', time: '', name: '', address: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [countdown, setCountdown] = useState('');
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // LINE 登入
  useEffect(() => {
    liff.init({ liffId: process.env.REACT_APP_LIFF_ID }).then(async () => {
      if (!liff.isLoggedIn()) liff.login();
      else {
        const profile = await liff.getProfile();
        setUserProfile(profile);
      }
    }).catch(console.error);
  }, []);

  // 地圖初始化
  useEffect(() => {
    if (!window.google || !window.google.maps) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => initMap({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => initMap({ lat: 25.0478, lng: 121.5319 })
    );

    function initMap(center) {
      mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
        center, zoom: 15
      });

      mapRef.current.addListener('click', (e) => {
        const latlng = e.latLng;
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new window.google.maps.Marker({ position: latlng, map: mapRef.current });
        new window.google.maps.Geocoder().geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setFormData(prev => ({
              ...prev,
              address: results[0].formatted_address,
              name: results[0].address_components?.[0]?.long_name || ''
            }));
          }
        });
      });
    }
  }, []);

  // 倒數顯示
  useEffect(() => {
    const timer = setInterval(() => {
      const { date, time } = formData;
      if (!date || !time) return setCountdown('');
      const target = new Date(`${date}T${time}`);
      const diff = target - new Date();
      if (diff <= 0) return setCountdown('⏰ 已過期');
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown(`⏳ 倒數 ${h} 時 ${m} 分 ${s} 秒`);
    }, 1000);
    return () => clearInterval(timer);
  }, [formData]);

  // 生成 .ics
  const generateICS = (date, time, name, address) => {
    const dateObj = new Date(`${date}T${time}`);
    const start = dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(dateObj.getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${Date.now()}@calendar-generator`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TourHub//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${name || '集合活動'}`, `LOCATION:${address}`, `DESCRIPTION=地圖：${mapUrl}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
  };

  const downloadICS = () => {
    const { date, time, name, address } = formData;
    if (!date || !time || !address) return alert('請填寫完整');
    const blob = new Blob([generateICS(date, time, name, address)], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name || '集合活動'}.ics`;
    link.click();
  };

  const addToGoogleCalendar = () => {
    const { date, time, name, address } = formData;
    if (!date || !time || !address) return alert('請填寫完整');
    const start = new Date(`${date}T${time}`).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(new Date(`${date}T${time}`).getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const text = encodeURIComponent(name || '集合活動');
    const details = encodeURIComponent('集合通知');
    const location = encodeURIComponent(address);
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`;
    window.open(calendarUrl, '_blank');
  };

  const shareInfo = async () => {
    const { date, time, name, address } = formData;
    const msg = {
      type: 'flex',
      altText: '集合通知',
      contents: {
        type: 'bubble',
        body: {
          type: 'box', layout: 'vertical', spacing: 'md',
          contents: [
            { type: 'text', text: `📍 ${name || '集合活動'}`, weight: 'bold', size: 'lg', color: '#1f2937' },
            {
              type: 'box', layout: 'vertical', spacing: 'sm', contents: [
                {
                  type: 'box', layout: 'baseline', spacing: 'sm',
                  contents: [
                    { type: 'text', text: '日期', color: '#6b7280', size: 'sm', flex: 1 },
                    { type: 'text', text: date, color: '#111827', size: 'sm', flex: 4 }
                  ]
                },
                {
                  type: 'box', layout: 'baseline', spacing: 'sm',
                  contents: [
                    { type: 'text', text: '時間', color: '#6b7280', size: 'sm', flex: 1 },
                    { type: 'text', text: time, color: '#111827', size: 'sm', flex: 4 }
                  ]
                },
                {
                  type: 'box', layout: 'baseline', spacing: 'sm',
                  contents: [
                    { type: 'text', text: '地址', color: '#6b7280', size: 'sm', flex: 1 },
                    { type: 'text', text: address, color: '#111827', size: 'sm', flex: 4 }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box', layout: 'vertical', spacing: 'sm',
          contents: [{
            type: 'button', style: 'primary', color: '#6366f1',
            action: {
              type: 'uri', label: '打開地圖',
              uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
            }
          }]
        }
      }
    };
    try {
      await liff.shareTargetPicker([msg]);
    } catch (e) {
      alert('分享失敗：' + e.message);
    }
  };

  return (
    <div className="container">
      {userProfile && (
        <div className="user-card">
          <img src={userProfile.pictureUrl} alt="avatar" className="user-avatar" />
          <span>Hi, {userProfile.displayName}</span>
        </div>
      )}

      <div className="content-wrapper">
        <div className="form-card">
          <label>集合名稱</label>
          <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="如：捷運站門口" />
          <label>集合日期</label>
          <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          <label>集合時間</label>
          <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
          <label>集合地址</label>
          <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="點地圖或手動輸入" />

          <div className="countdown">{countdown}</div>

          <button className="btn btn-download" onClick={downloadICS}><Download size={16} />下載 .ics</button>
          <button className="btn btn-calendar" onClick={addToGoogleCalendar}><Calendar size={16} />加入 Google Calendar</button>
          <button className="btn btn-map" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`)}><MapPin size={16} />查看地圖</button>
          <button className="btn btn-copy" onClick={() => navigator.clipboard.writeText(`${formData.name}\n📅 ${formData.date} ${formData.time}\n📍 ${formData.address}`)}><Copy size={16} />複製資訊</button>
          <button className="btn btn-share" onClick={shareInfo}><Share2 size={16} />分享到 LINE</button>
        </div>

        <div className="map-box">
          <h3>地圖選擇地點</h3>
          <div id="map" className="map" />
        </div>
      </div>
    </div>
  );
};

export default CalendarGenerator;
