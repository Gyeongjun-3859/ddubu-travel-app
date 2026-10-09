import React from 'react';
import { useSignedPhoto, BLANK_IMAGE } from '../utils/photoUrls';

// 사진 표시용 <img>. 비공개 저장소 사진은 서명 주소로 바꿔 띄우고(utils/photoUrls),
// 받는 동안엔 투명 이미지로 자리만 잡는다. 그 밖의 주소(게스트 사진·웹 주소)는 그대로.
// 사진 뷰어 확대 기능이 ref로 이미지 크기를 읽으므로 ref도 그대로 넘긴다.
const TripImg = React.forwardRef(function TripImg({ src, ...props }, ref) {
  const url = useSignedPhoto(src);
  return <img ref={ref} {...props} src={url || BLANK_IMAGE} />;
});

export default TripImg;
