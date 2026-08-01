import { useState, useEffect } from 'react';
import { S } from '../utils/helpers';

// 테마/글꼴/글자크기/글자색/내 위치 아이콘 — 로컬 저장되는 환경설정 묶음
export function useAppSettings() {
  const [appTheme, setAppTheme] = useState('light');
  const [elementScale, setElementScale] = useState(1);
  const [fontScale, setFontScale] = useState(1);
  const [appFont, setAppFont] = useState("'Pretendard', -apple-system, sans-serif");
  const [appTextColor, setAppTextColor] = useState("default");
  const [myLocationIcon, setMyLocationIcon] = useState("🚗");

  useEffect(() => {
    try {
      const savedElementScale = localStorage.getItem('my_travel_element_scale');
      let parsedElementScale = parseFloat(savedElementScale);
      if (isNaN(parsedElementScale) || parsedElementScale < 0.3 || parsedElementScale > 3) parsedElementScale = 1;
      setElementScale(parsedElementScale);

      const savedFontScale = localStorage.getItem('my_travel_font_scale');
      let parsedFontScale = parseFloat(savedFontScale);
      if (isNaN(parsedFontScale) || parsedFontScale < 0.5 || parsedFontScale > 2) parsedFontScale = 1;
      setFontScale(parsedFontScale);

      const savedTheme = localStorage.getItem('my_travel_theme');
      if (savedTheme) setAppTheme(S(savedTheme));

      const savedFont = localStorage.getItem('my_travel_font');
      if (savedFont) setAppFont(savedFont);

      const savedTextColor = localStorage.getItem('my_travel_text_color');
      if (savedTextColor) setAppTextColor(savedTextColor);

      const savedLocIcon = localStorage.getItem('my_travel_loc_icon');
      if (savedLocIcon) setMyLocationIcon(savedLocIcon);
    } catch (e) {}
  }, []);

  function handleElementScaleChange(e) {
    const scale = parseFloat(e.target.value);
    setElementScale(scale);
    try { localStorage.setItem('my_travel_element_scale', scale.toString()); } catch(e){}
  }

  function handleFontScaleChange(e) {
    const scale = parseFloat(e.target.value);
    setFontScale(scale);
    try { localStorage.setItem('my_travel_font_scale', scale.toString()); } catch(e){}
  }

  function handleThemeChange(themeName) {
    setAppTheme(S(themeName));
    try { localStorage.setItem('my_travel_theme', S(themeName)); } catch(e){}
  }

  return {
    appTheme, handleThemeChange,
    elementScale, handleElementScaleChange,
    fontScale, handleFontScaleChange,
    appFont, setAppFont,
    appTextColor, setAppTextColor,
    myLocationIcon, setMyLocationIcon,
  };
}
