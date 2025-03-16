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
      const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas({
        width: 200,
        height: 150,
      });
      croppedCanvas.toBlob((blob) => {
        const previewUrl = croppedCanvas.toDataURL("image/png", 0.8); // 0.8은 압축 품질 (0-1)
        onCrop(blob, previewUrl);
        onClose();
      }, "image/png", 0.8);
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
