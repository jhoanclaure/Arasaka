import { useEffect, useRef, useState } from "react";
import { ReactCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css"; // IMPORTANTE: Asegúrate de tener esto
import { getCroppedImage } from "../../utils/cropImage";

type Props = {
  image: string;
  rotation: number;
  showCrop: boolean;
  onCloseCrop: () => void;
  saveTrigger: number;
};

// Generamos la imagen rotada de forma nativa para evitar bugs visuales
const getRotatedImage = async (imageSrc: string, rotation: number): Promise<string> => {
  if (rotation % 360 === 0) return imageSrc;

  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageSrc;

  const isRotated90 = rotation % 180 !== 0;
  canvas.width = isRotated90 ? image.height : image.width;
  canvas.height = isRotated90 ? image.width : image.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  return canvas.toDataURL("image/jpeg", 1);
};

export function EditorInline({ image, rotation, showCrop, onCloseCrop, saveTrigger }: Props) {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotatedImageSrc, setRotatedImageSrc] = useState<string>(image);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });

  useEffect(() => {
    let isMounted = true;
    const processRotation = async () => {
      const src = await getRotatedImage(image, rotation);
      if (isMounted) setRotatedImageSrc(src);
    };
    processRotation();
    return () => { isMounted = false; };
  }, [image, rotation]);

  useEffect(() => {
    if (!completedCrop || !imgRef.current || completedCrop.width === 0 || completedCrop.height === 0) return;

    const runCrop = async () => {
      const cropped = await getCroppedImage(imgRef.current!, completedCrop, 0);
      setCroppedImage(cropped);
      onCloseCrop();
    };

    if (saveTrigger > 0) runCrop();
  }, [saveTrigger]);

  useEffect(() => {
    setCroppedImage(null);
  }, [rotation]);

  return (
    <div className="w-full h-full min-h-[300px] bg-[#1E1E1E] flex items-center justify-center overflow-hidden rounded-xl p-4">
      
      {/* EL TRUCO ESTÁ AQUÍ:
        Usamos display: "inline-block" en ReactCrop y display: "block" en la imagen.
        Esto asegura que el contenedor de recorte se reduzca EXACTAMENTE al tamaño de la foto.
      */}
      {showCrop ? (
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          style={{ display: "inline-block", maxWidth: "100%" }}
        >
          <img
            ref={imgRef}
            src={rotatedImageSrc}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "50vh", // Usar vh es mejor en móviles para que no se salga de la pantalla
              width: "auto",
              height: "auto",
            }}
            alt="Crop preview"
          />
        </ReactCrop>
      ) : (
        <img
          src={croppedImage || rotatedImageSrc}
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "50vh",
            width: "auto",
            height: "auto",
          }}
          alt="Preview"
        />
      )}
      
    </div>
  );
}