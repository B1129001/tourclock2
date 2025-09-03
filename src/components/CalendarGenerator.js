import React, { useState, useEffect, useRef } from 'react';
import liff from '@line/liff';
import { Calendar, MapPin, Share2, Copy, Clock, Star } from 'lucide-react';
import './CalendarGenerator.css';

const CalendarGenerator = () => {
  const [formData, setFormData] = useState({ 
    date: '', 
    time: '', 
    name: '', 
    address: '',
    participants: ''
  });
  const [userProfile, setUserProfile] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [countdownClass, setCountdownClass] = useState('countdown-red');
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [nameSearchResults, setNameSearchResults] = useState([]);
  const [showNameResults, setShowNameResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showQuickPicks, setShowQuickPicks] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const nameSearchBoxRef = useRef(null);
  const searchBoxRef = useRef(null);

  // —— 澀谷熱門景點 ——
  const shibuyaSpots = [
    { name: "SHIBUYA SKY (澀谷天空展望台)", address: "〒150-0043 東京都渋谷区道玄坂1丁目2−3 渋谷スカイ", lat: 35.6581, lng: 139.7016, icon: "🌟", category: "展望台" },
    { name: "澀谷十字路口", address: "〒150-0043 東京都渋谷区道玄坂2丁目1", lat: 35.6598, lng: 139.7006, icon: "🚶‍♂️", category: "名勝" },
    { name: "忠犬八公像", address: "〒150-0043 東京都渋谷区道玄坂2丁目1", lat: 35.6590, lng: 139.7005, icon: "🐕", category: "紀念碑" },
    { name: "澀谷109", address: "〒150-0043 東京都渋谷区道玄坂2丁目29−1", lat: 35.6592, lng: 139.6986, icon: "🛍️", category: "購物" },
    { name: "Center街", address: "〒150-0042 東京都渋谷区宇田川町", lat: 35.6617, lng: 139.6983, icon: "🎌", category: "街區" },
    { name: "澀谷Hikarie", address: "〒150-0002 東京都渋谷区渋谷2丁目21−1", lat: 35.6591, lng: 139.7038, icon: "🏢", category: "商業設施" },
    { name: "代代木公園", address: "〒150-0041 東京都渋谷区神南2丁目3−1", lat: 35.6732, lng: 139.6969, icon: "🌳", category: "公園" },
    { name: "明治神宮", address: "〒150-8440 東京都渋谷区代々木神園町1−1", lat: 35.6762, lng: 139.6993, icon: "⛩️", category: "神社" },
    { name: "原宿竹下通", address: "〒150-0001 東京都渋谷区神宮前1丁目17", lat: 35.6702, lng: 139.7026, icon: "🦄", category: "街區" },
    { name: "表參道Hills", address: "〒150-0001 東京都渋谷区神宮前4丁目12−10", lat: 35.6656, lng: 139.7103, icon: "🏬", category: "購物" },
    { name: "惠比壽花園廣場", address: "〒150-0013 東京都渋谷区恵比寿4丁目20", lat: 35.6464, lng: 139.7104, icon: "🌺", category: "商業設施" },
    { name: "宮下公園", address: "〒150-0001 東京都渋谷区神宮前6丁目20−10", lat: 35.6696, lng: 139.7015, icon: "🏀", category: "公園" }
  ];

  // 平台偵測
  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = () => /Android/i.test(navigator.userAgent);

  // Google Maps 載入檢查
  const checkGoogleMapsLoaded = () => new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve(true);
    let attempts = 0;
    const t = setInterval(() => {
      attempts++;
      if (window.google && window.google.maps) {
        clearInterval(t); resolve(true);
      } else if (attempts >= 50) {
        clearInterval(t); reject(new Error('Google Maps API 載入超時'));
      }
    }, 100);
  });

  // 初始化 LIFF
  useEffect(() => {
    (async () => {
      try {
        const liffId = process.env.REACT_APP_LIFF_ID;
        if (!liffId) { setIsLiffReady(false); return; }
        await liff.init({ liffId });
        setIsLiffReady(true);
        if (!liff.isLoggedIn()) liff.login();
        else setUserProfile(await liff.getProfile());
      } catch {
        setIsLiffReady(false);
      }
    })();
  }, []);

  // 初始化地圖
  useEffect(() => {
    const initializeMap = async () => {
      try {
        await checkGoogleMapsLoaded();
        setMapLoaded(true);
        const defaultPosition = { lat: 35.6581, lng: 139.7016 }; // SHIBUYA SKY
        initMap(defaultPosition);
      } catch {
        setMapLoaded(false);
      }
    };

    const initMap = (center) => {
      const el = document.getElementById('map');
      if (!el) return;
      mapRef.current = new window.google.maps.Map(el, {
        center, zoom: 15,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'on' }] }]
      });
      markerRef.current = new window.google.maps.Marker({
        position: center, map: mapRef.current,
        animation: window.google.maps.Animation.DROP,
        title: 'SHIBUYA SKY (澀谷天空展望台)'
      });
      setFormData(p => ({ ...p, name: 'SHIBUYA SKY (澀谷天空展望台)', address: '〒150-0043 東京都渋谷区道玄坂1丁目2−3 渋谷スカイ' }));

      // 點圖取位址
      mapRef.current.addListener('click', (event) => {
        const latLng = event.latLng;
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new window.google.maps.Marker({
          position: latLng, map: mapRef.current, animation: window.google.maps.Animation.DROP
        });
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            const placeName = results[0].address_components?.[0]?.long_name || '';
            setFormData(p => ({ ...p, address, name: p.name || placeName }));
          }
        });
      });

      // 地圖搜尋（雙機制）
      const mapSearchElement = document.getElementById('map-search');
      if (mapSearchElement && window.google.maps.places) {
        const searchBox = new window.google.maps.places.SearchBox(mapSearchElement);
        searchBoxRef.current = searchBox;

        mapSearchElement.addEventListener('input', () => {
          const q = mapSearchElement.value;
          if (q.length > 2) {
            const service = new window.google.maps.places.PlacesService(mapRef.current);
            service.textSearch({ query: q, fields: ['name','formatted_address','geometry','place_id'] }, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                setSearchResults(results.slice(0, 5)); setShowResults(true);
              }
            });
          } else setShowResults(false);
        });

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (!places?.length) return;
          const place = places[0];
          if (place.geometry?.location) {
            if (markerRef.current) markerRef.current.setMap(null);
            markerRef.current = new window.google.maps.Marker({
              position: place.geometry.location, map: mapRef.current, animation: window.google.maps.Animation.DROP, title: place.name
            });
            mapRef.current.setCenter(place.geometry.location); mapRef.current.setZoom(17);
            setFormData(p => ({ ...p, name: place.name, address: place.formatted_address }));
          }
          setShowResults(false);
        });
      }

      mapRef.current.addListener('click', () => { setShowResults(false); setShowQuickPicks(false); });
    };

    const t = setTimeout(initializeMap, 100);
    return () => clearTimeout(t);
  }, []);

  // 名稱搜尋
  const searchPlacesForName = (query) => {
    if (!query.trim() || !window.google?.maps?.places || !mapRef.current) return;
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    service.textSearch(
      { query, fields: ['name','formatted_address','geometry','place_id','types','rating','user_ratings_total','opening_hours'] },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setNameSearchResults(results.slice(0, 5)); setShowNameResults(true);
        }
      }
    );
  };

  const selectMapPlace = (place) => {
    if (!place.geometry?.location) return;
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position: place.geometry.location, map: mapRef.current, animation: window.google.maps.Animation.DROP, title: place.name
    });
    mapRef.current.setCenter(place.geometry.location); mapRef.current.setZoom(17);
    setFormData(p => ({ ...p, name: place.name, address: place.formatted_address }));
    setShowResults(false);
    const el = document.getElementById('map-search'); if (el) el.value = '';
  };

  const selectQuickSpot = (spot) => {
    if (!mapRef.current) return;
    if (markerRef.current) markerRef.current.setMap(null);
    const position = { lat: spot.lat, lng: spot.lng };
    markerRef.current = new window.google.maps.Marker({
      position, map: mapRef.current, animation: window.google.maps.Animation.DROP, title: spot.name
    });
    mapRef.current.setCenter(position); mapRef.current.setZoom(17);
    setFormData(p => ({ ...p, name: spot.name, address: spot.address }));
    setShowQuickPicks(false);
  };

  const selectNamePlace = (place) => {
    if (!place.geometry?.location) return;
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position: place.geometry.location, map: mapRef.current, animation: window.google.maps.Animation.DROP
    });
    mapRef.current.setCenter(place.geometry.location); mapRef.current.setZoom(17);
    setFormData(p => ({ ...p, name: place.name, address: place.formatted_address }));
    setShowNameResults(false);
  };

  const handleNameInputChange = (e) => {
    const v = e.target.value;
    setFormData({ ...formData, name: v });
    if (v.length > 2) searchPlacesForName(v);
    else setShowNameResults(false);
  };
  const hideNameResults = () => setTimeout(() => setShowNameResults(false), 200);

  // 倒數
  useEffect(() => {
    const t = setInterval(() => {
      const { date, time } = formData;
      if (!date || !time) { setCountdown(''); setCountdownClass('countdown-red'); return; }
      const target = new Date(`${date}T${time}`);
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) { setCountdown('⏰ 已過期'); setCountdownClass('countdown-expired'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff / 3600000) % 24);
      const minutes = Math.floor((diff / 60000) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      let txt = '';
      if (days > 0) { txt = `⏳ 還有 ${days} 天 ${hours} 小時`; setCountdownClass('countdown-safe'); }
      else if (hours > 1) { txt = `⏳ 還有 ${hours} 小時 ${minutes} 分鐘`; setCountdownClass('countdown-normal'); }
      else if (hours === 1) { txt = `⏳ 還有 1 小時 ${minutes} 分鐘`; setCountdownClass('countdown-warn'); }
      else if (minutes > 5) { txt = `⏳ 還有 ${minutes} 分鐘 ${seconds} 秒`; setCountdownClass('countdown-danger'); }
      else { txt = `🚨 最後 ${minutes} 分 ${seconds} 秒！`; setCountdownClass('countdown-critical'); }
      setCountdown(txt);
    }, 1000);
    return () => clearInterval(t);
  }, [formData]);

  // === 生成 .ics：含 Asia/Taipei VTIMEZONE、正確 UTC DTSTAMP、VALARM（30 分提醒） ===
  const generateICS = ({ title, address, startLocal, durationMin = 60 }) => {
    const start = new Date(startLocal);
    const end = new Date(start.getTime() + durationMin * 60000);
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const fmtUTC = (d) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    const fmtLocal = (d) =>
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const esc = (s='') => String(s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');

    const tzBlock = [
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Taipei',
      'X-LIC-LOCATION:Asia/Taipei',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0800',
      'TZOFFSETTO:+0800',
      'TZNAME:CST',
      'DTSTART:19700101T000000',
      'END:STANDARD',
      'END:VTIMEZONE'
    ].join('\r\n');

    const now = new Date();
    const uid = `${now.getTime()}-${Math.random().toString(36).slice(2)}@tourhub.local`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TourHub Calendar Generator//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      tzBlock,
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${fmtUTC(now)}`,
      `DTSTART;TZID=Asia/Taipei:${fmtLocal(start)}`,
      `DTEND;TZID=Asia/Taipei:${fmtLocal(end)}`,
      `SUMMARY:${esc(title)}`,
      `LOCATION:${esc(address)}`,
      `DESCRIPTION:${esc(title)} at ${esc(address)}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Event reminder',
      'TRIGGER:-PT30M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  };

  // === 單一入口：加入到行事曆（iOS .ics 外開 Safari；Android Google Calendar） ===
  const addToDeviceCalendar = () => {
    const { date, time, name, address } = formData;
    if (!date || !time || !address) { alert('請填寫日期、時間和地址'); return; }
    const title = name || '集合活動';
    const startLocal = `${date}T${time}`;

    const openBlobExternally = (blob) => {
      const url = URL.createObjectURL(blob);
      if (typeof liff !== 'undefined' && liff?.isInClient && liff?.openWindow && liff.isInClient()) {
        liff.openWindow({ url, external: true }); // iOS LINE -> Safari
      } else {
        window.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    if (isIOS()) {
      try {
        const ics = generateICS({ title, address, startLocal });
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        openBlobExternally(blob);
      } catch (e) {
        console.error(e);
        alert('加入行事曆失敗，請稍後重試');
      }
      return;
    }

    if (isAndroid()) {
      try {
        const startDate = new Date(startLocal);
        const endDate = new Date(startDate.getTime() + 60 * 60000);
        const iso = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const params = new URLSearchParams({
          action: 'TEMPLATE',
          text: title,
          dates: `${iso(startDate)}/${iso(endDate)}`,
          details: '集合通知',
          location: address,
          sf: 'true',
          output: 'xml'
        });
        const calendarUrl = `https://www.google.com/calendar/render?${params.toString()}`;
        if (typeof liff !== 'undefined' && liff?.isInClient && liff?.openWindow && liff.isInClient()) {
          liff.openWindow({ url: calendarUrl, external: true });
        } else {
          window.open(calendarUrl, '_blank');
        }
      } catch (e) {
        console.error(e);
        const ics = generateICS({ title, address, startLocal });
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      return;
    }

    // 其他平台：下載 .ics
    const ics = generateICS({ title, address, startLocal });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title}_${date.replace(/-/g, '')}.ics`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 複製資訊
  const copyInfo = async () => {
    const { date, time, name, address, participants } = formData;
    if (!date || !time || !address) { alert('請填寫日期、時間和地址'); return; }
    const info = [
      `📍 ${name || '集合活動'}`,
      `📅 ${new Date(`${date}T${time}`).toLocaleDateString('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'short'})}`,
      `🕒 ${time}`,
      `📍 ${address}`,
      participants ? `👥 參加者：${participants}` : '',
      `🗺️ 地圖：https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    ].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(info); alert('資訊已複製到剪貼簿！'); }
    catch { alert('複製失敗，請手動複製'); }
  };

  // 分享到 LINE（Flex）
  const shareInfo = async () => {
    const { date, time, name, address, participants } = formData;
    if (!date || !time || !address) { alert('請填寫日期、時間和地址'); return; }
    if (!isLiffReady) { alert('LINE 功能尚未準備就緒'); return; }
    try {
      const target = new Date(`${date}T${time}`); const now = new Date(); const diff = target - now;
      let countdownText = ''; let countdownColor = '#dc2626';
      if (diff <= 0) { countdownText = '⏰ 已過期'; countdownColor = '#6b7280'; }
      else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff / 3600000) % 24);
        const minutes = Math.floor((diff / 60000) % 60);
        if (days > 0) { countdownText = `⏳ 還有 ${days} 天 ${hours} 小時`; countdownColor = '#059669'; }
        else if (hours > 1) { countdownText = `⏳ 還有 ${hours} 小時 ${minutes} 分鐘`; countdownColor = '#0891b2'; }
        else if (hours === 1) { countdownText = `⏳ 還有 1 小時 ${minutes} 分鐘`; countdownColor = '#ea580c'; }
        else { countdownText = `⏳ 還有 ${minutes} 分鐘`; countdownColor = '#dc2626'; }
      }
      const flexMessage = {
        type: 'flex',
        altText: `集合通知 - ${name || '未命名地點'}`,
        contents: {
          type: 'bubble',
          styles: { body: { backgroundColor: '#f8fafc' } },
          body: {
            type: 'box', layout: 'vertical', spacing: 'md', paddingAll: 'lg',
            contents: [
              { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
                { type: 'text', text: '📍 集合通知', weight: 'bold', size: 'xl', color: '#1f2937' },
                { type: 'text', text: name || '未命名地點', weight: 'bold', size: 'lg', color: '#374151', wrap: true }
              ]},
              { type: 'separator', margin: 'md' },
              { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'md', contents: [
                { type: 'box', layout: 'horizontal', contents: [
                  { type: 'text', text: '📅', size: 'sm', flex: 0 },
                  { type: 'text', text: new Date(`${date}T${time}`).toLocaleDateString('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'short'}), size:'sm', color:'#111827', flex:4, margin:'sm' }
                ]},
                { type: 'box', layout: 'horizontal', contents: [
                  { type: 'text', text: '🕒', size: 'sm', flex: 0 },
                  { type: 'text', text: time, size:'sm', color:'#111827', flex:4, margin:'sm' }
                ]},
                { type: 'box', layout: 'horizontal', contents: [
                  { type: 'text', text: '📍', size: 'sm', flex: 0 },
                  { type: 'text', text: address, size:'sm', color:'#111827', wrap:true, flex:4, margin:'sm' }
                ]},
                ...(participants ? [{
                  type:'box', layout:'horizontal', contents:[
                    { type:'text', text:'👥', size:'sm', flex:0 },
                    { type:'text', text:`參加者：${participants}`, size:'sm', color:'#111827', wrap:true, flex:4, margin:'sm' }
                  ]
                }] : [])
              ]},
           
              ...(diff > 0 && diff < 24*60*60*1000 ? [{
                type:'text', text:'💡 建議提前 10-15 分鐘出發', size:'xs', color:'#6b7280', wrap:true, margin:'sm', align:'center'
              }] : [])
            ]
          },
          footer: { type:'box', layout:'vertical', spacing:'sm', contents:[
            { type:'button', style:'primary', height:'sm', color:'#4f46e5',
              action:{ type:'uri', label:'🗺️ 查看地圖', uri:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` } }
          ]}
        }
      };
      if (liff.isApiAvailable('shareTargetPicker')) await liff.shareTargetPicker([flexMessage]);
      else alert('此環境不支援 LINE 分享功能');
    } catch (e) { alert('分享失敗：' + e.message); }
  };

  const openMap = () => {
    if (!formData.address) { alert('請先設定地址'); return; }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container">
      {userProfile && (
        <div className="user-card">
          <img src={userProfile.pictureUrl} alt="用戶頭像" className="user-avatar" />
          <span>Hi, {userProfile.displayName}</span>
        </div>
      )}

      <div className="content-wrapper">
        <div className="form-card">
          <h2>📅 集合活動設定</h2>

          <div className="form-group">
            <label htmlFor="name">集合名稱</label>
            <div className="search-container">
              <input 
                id="name"
                type="text"
                value={formData.name}
                onChange={handleNameInputChange}
                onBlur={hideNameResults}
                onFocus={() => {
                  if (nameSearchResults.length > 0) setShowNameResults(true);
                  setShowQuickPicks(true);
                }}
                placeholder="搜尋地點名稱或選擇快速景點"
              />
              {showQuickPicks && (
                <div className="quick-picks">
                  <div className="quick-picks-header">
                    <Star size={14} />
                    <span>澀谷熱門景點</span>
                  </div>
                  <div className="quick-spots-grid">
                    {shibuyaSpots.map((spot, i) => (
                      <div key={i} className="quick-spot-item" onClick={() => selectQuickSpot(spot)}>
                        <span className="spot-icon">{spot.icon}</span>
                        <div className="spot-info">
                          <div className="spot-name">{spot.name}</div>
                          <div className="spot-category">{spot.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showNameResults && nameSearchResults.length > 0 && (
                <div className="search-results">
                  {nameSearchResults.map((place, idx) => (
                    <div key={`${place.place_id}-${idx}`} className="search-result-item" onClick={() => selectNamePlace(place)}>
                      <div className="result-icon">📍</div>
                      <div className="result-info">
                        <div className="result-name">{place.name}</div>
                        <div className="result-address">{place.formatted_address}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">集合日期</label>
              <input 
                id="date" type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">集合時間</label>
              <input 
                id="time" type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">集合地址</label>
            <input 
              id="address" type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="請點選地圖或手動輸入精確地址"
            />
            <p className="address-hint">💡點選地圖上的位置來獲得精確地址</p>
          </div>

          <div className="form-group">
            <label htmlFor="participants">參加者（選填）</label>
            <input 
              id="participants" type="text"
              value={formData.participants}
              onChange={e => setFormData({ ...formData, participants: e.target.value })}
              placeholder="輸入人名"
            />
          </div>

          {countdown && (
            <div className={`countdown ${countdownClass}`}>
              <Clock size={16} />
              {countdown}
            </div>
          )}

          <div className="button-grid">
            <button className="btn btn-calendar" onClick={addToDeviceCalendar}>
              <Calendar size={16} />
              加入到行事曆
            </button>
            <button className="btn btn-map" onClick={openMap}>
              <MapPin size={16} />
              查看地圖
            </button>
            <button className="btn btn-copy" onClick={copyInfo}>
              <Copy size={16} />
              複製資訊
            </button>
            <button className="btn btn-share" onClick={shareInfo} disabled={!isLiffReady}>
              <Share2 size={16} />
              分享到LINE好友
            </button>
          </div>
        </div>

        <div className="map-box">
          <h3>🗺️ 地圖 - 選擇精確位置</h3>
          {!mapLoaded && <div className="map-loading"><p>⏳ 地圖載入中...</p></div>}
          <div className="map-search-container">
            <input id="map-search" type="text" placeholder="搜尋地點..." className="map-search-input" />
            {showResults && searchResults.length > 0 && (
              <div className="map-search-results">
                {searchResults.map((place, idx) => (
                  <div key={`${place.place_id}-${idx}`} className="search-result-item" onClick={() => selectMapPlace(place)}>
                    <div className="result-icon">📍</div>
                    <div className="result-info">
                      <div className="result-name">{place.name}</div>
                      <div className="result-address">{place.formatted_address}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div id="map" className="map" style={{ display: mapLoaded ? 'block' : 'none' }} />
          <p className="map-hint">💡點擊地圖來選擇其他精確的集合位置</p>

          <div className="location-shortcuts">
            <h4>🎌 景點推薦快速導航</h4>
            <div className="shortcuts-grid">
              {shibuyaSpots.slice(0, 6).map((spot, i) => (
                <button key={i} className="shortcut-btn" onClick={() => selectQuickSpot(spot)}>
                  <span>{spot.icon}</span>
                  <span>{spot.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGenerator;
