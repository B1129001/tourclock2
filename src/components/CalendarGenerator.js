import React, { useState, useEffect, useRef } from 'react';
import liff from '@line/liff';
import { Download, MapPin, Share2, Copy, Calendar, Clock, Users, Star } from 'lucide-react';
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

  // 澀谷熱門景點預設列表
  const shibuyaSpots = [
    {
      name: "SHIBUYA SKY (澀谷天空展望台)",
      address: "〒150-0043 東京都渋谷区道玄坂1丁目2−3 渋谷スカイ",
      lat: 35.6581,
      lng: 139.7016,
      icon: "🌟",
      category: "展望台"
    },
    {
      name: "澀谷十字路口",
      address: "〒150-0043 東京都渋谷区道玄坂2丁目1",
      lat: 35.6598,
      lng: 139.7006,
      icon: "🚶‍♂️",
      category: "名勝"
    },
    {
      name: "忠犬八公像",
      address: "〒150-0043 東京都渋谷区道玄坂2丁目1",
      lat: 35.6590,
      lng: 139.7005,
      icon: "🐕",
      category: "紀念碑"
    },
    {
      name: "澀谷109",
      address: "〒150-0043 東京都渋谷区道玄坂2丁目29−1",
      lat: 35.6592,
      lng: 139.6986,
      icon: "🛍️",
      category: "購物"
    },
    {
      name: "Center街",
      address: "〒150-0042 東京都渋谷区宇田川町",
      lat: 35.6617,
      lng: 139.6983,
      icon: "🎌",
      category: "街區"
    },
    {
      name: "澀谷Hikarie",
      address: "〒150-0002 東京都渋谷区渋谷2丁目21−1",
      lat: 35.6591,
      lng: 139.7038,
      icon: "🏢",
      category: "商業設施"
    },
    {
      name: "代代木公園",
      address: "〒150-0041 東京都渋谷区神南2丁目3−1",
      lat: 35.6732,
      lng: 139.6969,
      icon: "🌳",
      category: "公園"
    },
    {
      name: "明治神宮",
      address: "〒150-8440 東京都渋谷区代々木神園町1−1",
      lat: 35.6762,
      lng: 139.6993,
      icon: "⛩️",
      category: "神社"
    },
    {
      name: "原宿竹下通",
      address: "〒150-0001 東京都渋谷区神宮前1丁目17",
      lat: 35.6702,
      lng: 139.7026,
      icon: "🦄",
      category: "街區"
    },
    {
      name: "表參道Hills",
      address: "〒150-0001 東京都渋谷区神宮前4丁目12−10",
      lat: 35.6656,
      lng: 139.7103,
      icon: "🏬",
      category: "購物"
    },
    {
      name: "惠比壽花園廣場",
      address: "〒150-0013 東京都渋谷区恵比寿4丁目20",
      lat: 35.6464,
      lng: 139.7104,
      icon: "🌺",
      category: "商業設施"
    },
    {
      name: "宮下公園",
      address: "〒150-0001 東京都渋谷区神宮前6丁目20−10",
      lat: 35.6696,
      lng: 139.7015,
      icon: "🏀",
      category: "公園"
    }
  ];

  // 檢查 Google Maps API 是否已載入
  const checkGoogleMapsLoaded = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve(true);
        return;
      }

      let attempts = 0;
      const maxAttempts = 50; // 5 秒超時
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Google Maps API 載入超時'));
        }
      }, 100);
    });
  };

  // 初始化 LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.REACT_APP_LIFF_ID;
        if (!liffId) {
          console.warn('LIFF ID 未設定，跳過 LIFF 初始化');
          setIsLiffReady(false);
          return;
        }

        await liff.init({ liffId });
        setIsLiffReady(true);
        
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          const profile = await liff.getProfile();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('LIFF 初始化失敗:', error);
        setIsLiffReady(false);
      }
    };

    initLiff();
  }, []);

  // 初始化地圖
  useEffect(() => {
    const initializeMap = async () => {
      try {
        await checkGoogleMapsLoaded();
        setMapLoaded(true);
        
        // 設定預設位置為SHIBUYA SKY
        const defaultPosition = { lat: 35.6581, lng: 139.7016 };
        
        initMap(defaultPosition);
      } catch (error) {
        console.error('地圖初始化失敗:', error);
        setMapLoaded(false);
      }
    };

    const initMap = (center) => {
      const mapElement = document.getElementById('map');
      if (!mapElement) return;
      
      mapRef.current = new window.google.maps.Map(mapElement, {
        center,
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // 在SHIBUYA SKY位置放置初始標記
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapRef.current,
        animation: window.google.maps.Animation.DROP,
        title: 'SHIBUYA SKY (澀谷天空展望台)'
      });

      // 設定初始表單數據
      setFormData(prev => ({
        ...prev,
        name: 'SHIBUYA SKY (澀谷天空展望台)',
        address: '〒150-0043 東京都渋谷区道玄坂1丁目2−3 渋谷スカイ'
      }));

      // 地圖點擊事件
      mapRef.current.addListener('click', (event) => {
        const latLng = event.latLng;
        
        // 清除之前的標記
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        
        // 添加新標記
        markerRef.current = new window.google.maps.Marker({
          position: latLng,
          map: mapRef.current,
          animation: window.google.maps.Animation.DROP
        });

        // 反向地理編碼
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const result = results[0];
            const address = result.formatted_address;
            const placeName = result.address_components?.[0]?.long_name || '';
            
            setFormData(prev => ({
              ...prev,
              address: address,
              name: prev.name || placeName
            }));
          }
        });
      });

      // 地圖搜索框功能
      const mapSearchElement = document.getElementById('map-search');
      if (mapSearchElement && window.google.maps.places) {
        const searchBox = new window.google.maps.places.SearchBox(mapSearchElement);
        searchBoxRef.current = searchBox;
        
        // 監聽搜尋框變化
        mapSearchElement.addEventListener('input', () => {
          const query = mapSearchElement.value;
          if (query.length > 2) {
            // 使用 PlacesService 進行搜尋
            const service = new window.google.maps.places.PlacesService(mapRef.current);
            const request = {
              query: query,
              fields: ['name', 'formatted_address', 'geometry', 'place_id']
            };
            
            service.textSearch(request, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                setSearchResults(results.slice(0, 5));
                setShowResults(true);
              }
            });
          } else {
            setShowResults(false);
          }
        });
        
        // 傳統的 SearchBox 事件監聽器作為備用
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places.length === 0) return;

          const place = places[0];
          if (place.geometry && place.geometry.location) {
            // 清除之前的標記
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            
            // 添加新標記
            markerRef.current = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapRef.current,
              animation: window.google.maps.Animation.DROP,
              title: place.name
            });

            // 設置地圖中心和縮放
            mapRef.current.setCenter(place.geometry.location);
            mapRef.current.setZoom(17);

            // 更新表單數據
            setFormData(prev => ({
              ...prev,
              name: place.name,
              address: place.formatted_address
            }));
          }
          
          setShowResults(false);
        });
      }

      // 點擊地圖時隱藏搜尋結果
      mapRef.current.addListener('click', () => {
        setShowResults(false);
        setShowQuickPicks(false);
      });
    };

    // 延遲初始化以確保 DOM 元素存在
    const timer = setTimeout(initializeMap, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 集合名稱搜尋功能
  const searchPlacesForName = (query) => {
    if (!query.trim() || !window.google?.maps?.places || !mapRef.current) return;

    const service = new window.google.maps.places.PlacesService(mapRef.current);
    const request = {
      query: query,
      fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types', 'rating', 'user_ratings_total', 'opening_hours'],
    };

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setNameSearchResults(results.slice(0, 5));
        setShowNameResults(true);
      }
    });
  };

  // 選擇地圖搜尋結果
  const selectMapPlace = (place) => {
    if (!place.geometry || !place.geometry.location) return;

    // 清除之前的標記
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 添加標記
    markerRef.current = new window.google.maps.Marker({
      position: place.geometry.location,
      map: mapRef.current,
      animation: window.google.maps.Animation.DROP,
      title: place.name
    });

    // 設置地圖中心和縮放
    mapRef.current.setCenter(place.geometry.location);
    mapRef.current.setZoom(17);

    // 更新表單數據
    setFormData(prev => ({
      ...prev,
      name: place.name,
      address: place.formatted_address
    }));

    // 隱藏搜尋結果並清空搜尋框
    setShowResults(false);
    const mapSearchElement = document.getElementById('map-search');
    if (mapSearchElement) {
      mapSearchElement.value = '';
    }
  };
  const selectQuickSpot = (spot) => {
    if (!mapRef.current) return;

    // 清除之前的標記
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const position = { lat: spot.lat, lng: spot.lng };

    // 添加標記
    markerRef.current = new window.google.maps.Marker({
      position: position,
      map: mapRef.current,
      animation: window.google.maps.Animation.DROP,
      title: spot.name
    });

    // 設置地圖中心和縮放
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(17);

    // 更新表單數據
    setFormData(prev => ({
      ...prev,
      name: spot.name,
      address: spot.address
    }));

    // 隱藏快速選擇
    setShowQuickPicks(false);
  };

  // 選擇集合名稱搜尋結果
  const selectNamePlace = (place) => {
    if (!place.geometry || !place.geometry.location) return;

    // 清除之前的標記
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 添加標記
    markerRef.current = new window.google.maps.Marker({
      position: place.geometry.location,
      map: mapRef.current,
      animation: window.google.maps.Animation.DROP
    });

    // 設置地圖中心和縮放
    mapRef.current.setCenter(place.geometry.location);
    mapRef.current.setZoom(17);

    // 更新表單數據
    setFormData(prev => ({
      ...prev,
      name: place.name,
      address: place.formatted_address
    }));

    // 隱藏搜尋結果
    setShowNameResults(false);
  };

  // 處理集合名稱輸入變化
  const handleNameInputChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });
    
    if (value.length > 2) {
      searchPlacesForName(value);
    } else {
      setShowNameResults(false);
    }
  };

  // 隱藏集合名稱搜尋結果
  const hideNameResults = () => {
    setTimeout(() => setShowNameResults(false), 200);
  };

  // 倒數計時器
  useEffect(() => {
    const timer = setInterval(() => {
      const { date, time } = formData;
      if (!date || !time) {
        setCountdown('');
        setCountdownClass('countdown-red');
        return;
      }

      const target = new Date(`${date}T${time}`);
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('⏰ 已過期');
        setCountdownClass('countdown-expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let countdownText = '';
      if (days > 0) {
        countdownText = `⏳ 還有 ${days} 天 ${hours} 小時`;
        setCountdownClass('countdown-safe');
      } else if (hours > 1) {
        countdownText = `⏳ 還有 ${hours} 小時 ${minutes} 分鐘`;
        setCountdownClass('countdown-normal');
      } else if (hours === 1) {
        countdownText = `⏳ 還有 1 小時 ${minutes} 分鐘`;
        setCountdownClass('countdown-warn');
      } else if (minutes > 5) {
        countdownText = `⏳ 還有 ${minutes} 分鐘 ${seconds} 秒`;
        setCountdownClass('countdown-danger');
      } else {
        countdownText = `🚨 最後 ${minutes} 分 ${seconds} 秒！`;
        setCountdownClass('countdown-critical');
      }

      setCountdown(countdownText);
    }, 1000);

    return () => clearInterval(timer);
  }, [formData]);

  // 建立 .ics 檔內容
  const generateICS = (title, address, startDateTime, durationInMinutes = 60) => {
    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + durationInMinutes * 60000);

    const formatDate = (date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TourHub Calendar Generator//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@tourhub.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${title}`,
      `LOCATION:${address}`,
      `DESCRIPTION:${title} at ${address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  };

  // 下載 ICS 檔案
  const downloadICS = () => {
    const { date, time, name, address } = formData;
    if (!date || !time || !address) {
      alert('請填寫日期、時間和地址');
      return;
    }

    try {
      const icsContent = generateICS(date, time, name, address);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name || '集合活動'}_${date.replace(/-/g, '')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('下載失敗:', error);
      alert('下載失敗，請稍後再試');
    }
  };

  // iPhone Safari 可直接觸發加入行事曆
  const downloadICSDirect = () => {
    const { date, time, name, address } = formData;

    if (!date || !time || !address) {
      alert('請先輸入完整的日期、時間與地址');
      return;
    }

    const startDateTime = `${date}T${time}`;
    const icsContent = generateICS(name || '集合活動', address, startDateTime);

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${(name || '活動')}_${date.replace(/-/g, '')}.ics`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 加入 Google Calendar
  const addToGoogleCalendar = () => {
    const { date, time, name, address } = formData;
    if (!date || !time || !address) {
      alert('請填寫日期、時間和地址');
      return;
    }

    try {
      const startTime = new Date(`${date}T${time}`);
      const endTime = new Date(startTime.getTime() + 3600000);
      
      const start = startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: name || '集合活動',
        dates: `${start}/${end}`,
        details: '集合通知',
        location: address,
        sf: 'true',
        output: 'xml'
      });

      const calendarUrl = `https://www.google.com/calendar/render?${params.toString()}`;
      window.open(calendarUrl, '_blank');
    } catch (error) {
      console.error('開啟 Google Calendar 失敗:', error);
      alert('開啟 Google Calendar 失敗');
    }
  };

  // 複製活動資訊
  const copyInfo = async () => {
    const { date, time, name, address, participants } = formData;
    if (!date || !time || !address) {
      alert('請填寫日期、時間和地址');
      return;
    }

    const info = [
      `📍 ${name || '集合活動'}`,
      `📅 ${new Date(`${date}T${time}`).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })}`,
      `🕒 ${time}`,
      `📍 ${address}`,
      participants ? `👥 參加者：${participants}` : '',
      `🗺️ 地圖：https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(info);
      alert('資訊已複製到剪貼簿！');
    } catch (error) {
      console.error('複製失敗:', error);
      alert('複製失敗，請手動複製');
    }
  };

  // 分享到 LINE
  const shareInfo = async () => {
    const { date, time, name, address, participants } = formData;
    if (!date || !time || !address) {
      alert('請填寫日期、時間和地址');
      return;
    }

    if (!isLiffReady) {
      alert('LINE 功能尚未準備就緒');
      return;
    }

    try {
      const target = new Date(`${date}T${time}`);
      const now = new Date();
      const diff = target - now;
      
      let countdownText = '';
      let countdownColor = '#dc2626';
      
      if (diff <= 0) {
        countdownText = '⏰ 已過期';
        countdownColor = '#6b7280';
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        
        if (days > 0) {
          countdownText = `⏳ 還有 ${days} 天 ${hours} 小時`;
          countdownColor = '#059669';
        } else if (hours > 1) {
          countdownText = `⏳ 還有 ${hours} 小時 ${minutes} 分鐘`;
          countdownColor = '#0891b2';
        } else if (hours === 1) {
          countdownText = `⏳ 還有 1 小時 ${minutes} 分鐘`;
          countdownColor = '#ea580c';
        } else {
          countdownText = `⏳ 還有 ${minutes} 分鐘`;
          countdownColor = '#dc2626';
        }
      }

      const flexMessage = {
        type: 'flex',
        altText: `集合通知 - ${name || '未命名地點'}`,
        contents: {
          type: 'bubble',
          styles: {
            body: {
              backgroundColor: '#f8fafc'
            }
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            paddingAll: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '📍 集合通知',
                    weight: 'bold',
                    size: 'xl',
                    color: '#1f2937'
                  },
                  {
                    type: 'text',
                    text: name || '未命名地點',
                    weight: 'bold',
                    size: 'lg',
                    color: '#374151',
                    wrap: true
                  }
                ]
              },
              {
                type: 'separator',
                margin: 'md'
              },
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                margin: 'md',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: '📅',
                        size: 'sm',
                        flex: 0
                      },
                      {
                        type: 'text',
                        text: new Date(`${date}T${time}`).toLocaleDateString('zh-TW', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        }),
                        size: 'sm',
                        color: '#111827',
                        flex: 4,
                        margin: 'sm'
                      }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: '🕒',
                        size: 'sm',
                        flex: 0
                      },
                      {
                        type: 'text',
                        text: time,
                        size: 'sm',
                        color: '#111827',
                        flex: 4,
                        margin: 'sm'
                      }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: '📍',
                        size: 'sm',
                        flex: 0
                      },
                      {
                        type: 'text',
                        text: address,
                        size: 'sm',
                        color: '#111827',
                        wrap: true,
                        flex: 4,
                        margin: 'sm'
                      }
                    ]
                  },
                  ...(participants ? [{
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: '👥',
                        size: 'sm',
                        flex: 0
                      },
                      {
                        type: 'text',
                        text: `參加者：${participants}`,
                        size: 'sm',
                        color: '#111827',
                        wrap: true,
                        flex: 4,
                        margin: 'sm'
                      }
                    ]
                  }] : [])
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: countdownColor === '#6b7280' ? '#f3f4f6' : '#fef2f2',
                cornerRadius: 'md',
                paddingAll: 'md',
                margin: 'md',
                contents: [
                  {
                    type: 'text',
                    text: countdownText,
                    weight: 'bold',
                    size: 'md',
                    color: countdownColor,
                    align: 'center',
                    wrap: true
                  }
                ]
              },
              ...(diff > 0 && diff < 24 * 60 * 60 * 1000 ? [{
                type: 'text',
                text: '💡 建議提前 10-15 分鐘出發',
                size: 'xs',
                color: '#6b7280',
                wrap: true,
                margin: 'sm',
                align: 'center'
              }] : [])
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                height: 'sm',
                color: '#4f46e5',
                action: {
                  type: 'uri',
                  label: '🗺️ 查看地圖',
                  uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                }
              }
            ]
          }
        }
      };

      if (liff.isApiAvailable('shareTargetPicker')) {
        await liff.shareTargetPicker([flexMessage]);
      } else {
        alert('此環境不支援 LINE 分享功能');
      }
    } catch (error) {
      console.error('分享失敗:', error);
      alert('分享失敗：' + error.message);
    }
  };

  // 開啟地圖
  const openMap = () => {
    if (!formData.address) {
      alert('請先設定地址');
      return;
    }
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`;
    window.open(mapUrl, '_blank');
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
          <h2>📅 東京澀谷集合活動設定</h2>
          
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
              
              {/* 快速景點選擇 */}
              {showQuickPicks && (
                <div className="quick-picks">
                  <div className="quick-picks-header">
                    <Star size={14} />
                    <span>澀谷熱門景點</span>
                  </div>
                  <div className="quick-spots-grid">
                    {shibuyaSpots.map((spot, index) => (
                      <div 
                        key={index}
                        className="quick-spot-item"
                        onClick={() => selectQuickSpot(spot)}
                      >
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

              {/* 一般搜尋結果 */}
              {showNameResults && nameSearchResults.length > 0 && (
                <div className="search-results">
                  {nameSearchResults.map((place, index) => (
                    <div 
                      key={`${place.place_id}-${index}`}
                      className="search-result-item"
                      onClick={() => selectNamePlace(place)}
                    >
                      <div className="result-icon">
                        📍
                      </div>
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
                id="date"
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">集合時間</label>
              <input 
                id="time"
                type="time" 
                value={formData.time} 
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">集合地址</label>
            <input 
              id="address"
              type="text"
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
              placeholder="請點選地圖或手動輸入精確地址"
            />
            <p className="address-hint">💡點選地圖上的位置來獲得精確地址</p>
          </div>

          <div className="form-group">
            <label htmlFor="participants">參加者（選填）</label>
            <input 
              id="participants"
              type="text"
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
            <button className="btn btn-download" onClick={downloadICSDirect}>
              <Download size={16} />
              下載 .ics
            </button>
            <button className="btn btn-calendar" onClick={addToGoogleCalendar}>
              <Calendar size={16} />
              Google Calendar
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
          {!mapLoaded && (
            <div className="map-loading">
              <p>⏳ 地圖載入中...</p>
            </div>
          )}
          <div className="map-search-container">
            <input 
              id="map-search"
              type="text"
              placeholder="搜尋地點..."
              className="map-search-input"
            />
            {showResults && searchResults.length > 0 && (
              <div className="map-search-results">
                {searchResults.map((place, index) => (
                  <div 
                    key={`${place.place_id}-${index}`}
                    className="search-result-item"
                    onClick={() => selectMapPlace(place)}
                  >
                    <div className="result-icon">
                      📍
                    </div>
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
          
          {/* 澀谷景點快速導航 */}
          <div className="location-shortcuts">
            <h4>🎌 景點推薦快速導航</h4>
            <div className="shortcuts-grid">
              {shibuyaSpots.slice(0, 6).map((spot, index) => (
                <button 
                  key={index}
                  className="shortcut-btn"
                  onClick={() => selectQuickSpot(spot)}
                >
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
