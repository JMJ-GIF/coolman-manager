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
  
      // 원본 크기 기준 비율 유지
      const originalWidth = croppedCanvas.width;
      const originalHeight = croppedCanvas.height;
  
      // 최소 보장 해상도 (예: 너비 최소 400px)
      const minWidth = 400;
      const scale = originalWidth < minWidth ? minWidth / originalWidth : 1;
  
      // 고품질 새 캔버스 생성
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = originalWidth * scale;
      scaledCanvas.height = originalHeight * scale;
  
      const ctx = scaledCanvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(croppedCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  
      scaledCanvas.toBlob((blob) => {
        const previewUrl = scaledCanvas.toDataURL("image/png", 0.9); // 압축 품질 향상
        onCrop(blob, previewUrl);
        onClose();
      }, "image/png", 0.9);
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
