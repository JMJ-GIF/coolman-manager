import React, { useRef, useState, useEffect } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import "./ImageCropper.scss";

const ImageCropper = ({ onCrop, onClose }) => {
  const cropperRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {   
    openFilePicker();
  }, []);

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => onSelectImage(e);
    input.click();
  };

  const onSelectImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      onClose(); 
    }
  };

  const cropImage = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      const croppedCanvas = cropper.getCroppedCanvas();
  
      // 원본 크기
      const originalWidth = croppedCanvas.width;
      const originalHeight = croppedCanvas.height;
  
      // 최대 크기 설정 (4:3 기준: 800×600 예시)
      const maxWidth = 800;
      const maxHeight = 600;
  
      // 일단 원본 크기를 할당
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;
  
      // 1) 가로가 800을 넘으면 비율에 맞춰 축소
      if (targetWidth > maxWidth) {
        const ratio = maxWidth / targetWidth;
        targetWidth = maxWidth;
        targetHeight = targetHeight * ratio;
      }
  
      // 2) 축소 후에도 세로가 600을 넘으면 또 축소
      if (targetHeight > maxHeight) {
        const ratio = maxHeight / targetHeight;
        targetHeight = maxHeight;
        targetWidth = targetWidth * ratio;
      }
  
      // 새 캔버스에 그리기
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = targetWidth;
      scaledCanvas.height = targetHeight;
  
      const ctx = scaledCanvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
  
      ctx.drawImage(croppedCanvas, 0, 0, targetWidth, targetHeight);
  
      // PNG로 toBlob (알파 채널 유지)
      scaledCanvas.toBlob((blob) => {
        const previewUrl = scaledCanvas.toDataURL("image/png");
        onCrop(blob, previewUrl);
        onClose();
      }, "image/png");
    }
  };
  

  if (!image) return null; 

  return (
    <div className="overlay-cropper">
      <div className="modal-cropper">        
        <Cropper 
          src={image} 
          style={{ height: 400, width: "100%" }} 
          ref={cropperRef} 
          aspectRatio={4 / 3} 
          viewMode={0} 
          dragMode="crop" 
          autoCropArea={0.5} 
          cropBoxResizable={true} 
          zoomable={true} 
          guides={true} 
        />
        <p className="cropper-instruction">사진은 4:3 비율만 허용됩니다</p>
        <p className="cropper-instruction">배경을 투명으로 만들어 업로드 하는것을 권장합니다</p>
        <div className="button-group">
          <button onClick={onClose}>취소</button>
          <button onClick={cropImage}>자르기</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
