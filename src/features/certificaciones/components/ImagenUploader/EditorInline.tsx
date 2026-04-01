import { useEffect, useRef, useState } from "react";
import { ReactCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getCroppedImage } from "../../utils/cropImage";

type Props = {
  image: string;
  rotation: number;
  showCrop: boolean;
  onCloseCrop: () => void;
  saveTrigger: number;
};

// Generamos la imagen rotada. 
// NUEVO: Ahora soporta diferencias de ángulos para rotar recortes previos.
const getRotatedImage = async (imageSrc: string, rotation: number): Promise<string> => {
  // Aseguramos que la rotación siempre sea un número positivo exacto (0, 90, 180, 270)
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  if (normalizedRotation === 0) return imageSrc;

  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageSrc;

  const isRotated90 = normalizedRotation === 90 || normalizedRotation === 270;
  canvas.width = isRotated90 ? image.height : image.width;
  canvas.height = isRotated90 ? image.width : image.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normalizedRotation * Math.PI) / 180);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  return canvas.toDataURL("image/jpeg", 1);
};

export function EditorInline({ image, rotation, showCrop, onCloseCrop, saveTrigger }: Props) {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  
  // NUEVO: Guardamos en qué ángulo de rotación exacto se encontraba la imagen cuando se recortó
  const [cropSavedAtRotation, setCropSavedAtRotation] = useState(0);
  
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  
  // NUEVO: Un único estado maestro que decide qué se pinta en la pantalla (la original o el recorte final)
  const [displayImage, setDisplayImage] = useState<string>(image);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });

  // 1. Efecto maestro: Decide qué procesar visualmente cuando aprietas el botón "Rotar"
  useEffect(() => {
    let isMounted = true;
    const processRotation = async () => {
      if (croppedImage) {
        // Si ya hay un recorte guardado, calculamos cuántos grados extra se ha rotado DESPUÉS de recortar
        const diff = rotation - cropSavedAtRotation;
        const src = await getRotatedImage(croppedImage, diff);
        if (isMounted) setDisplayImage(src);
      } else {
        // Si no se ha recortado nunca, simplemente rotamos la imagen original
        const src = await getRotatedImage(image, rotation);
        if (isMounted) setDisplayImage(src);
      }
    };
    processRotation();
    return () => { isMounted = false; };
  }, [image, rotation, croppedImage, cropSavedAtRotation]);

  // 2. Efecto para aplicar y guardar el recorte
  useEffect(() => {
    if (!completedCrop || !imgRef.current || completedCrop.width === 0 || completedCrop.height === 0) return;

    const runCrop = async () => {
      // Extraemos el recorte de lo que sea que esté visualmente en pantalla
      const cropped = await getCroppedImage(imgRef.current!, completedCrop, 0);
      setCroppedImage(cropped);
      setCropSavedAtRotation(rotation); // Memorizamos la rotación en la que quedó fijada
      onCloseCrop();
    };

    if (saveTrigger > 0) runCrop();
  }, [saveTrigger]);

  // 3. Resetear el cuadradito de selección para que siempre salga limpio
  useEffect(() => {
    setCompletedCrop(null);
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    // NUEVO: YA NO borramos el `croppedImage` aquí. Así tu progreso sobrevive.
  }, [rotation, showCrop]);

  return (
    <div className="w-full h-full min-h-[300px] bg-[#1E1E1E] flex items-center justify-center overflow-hidden rounded-xl p-4">
      {showCrop ? (
        <ReactCrop
          key={`crop-key-${rotation}-${showCrop}`} // Obliga a reiniciarse limpio visualmente
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          style={{ display: "inline-block", maxWidth: "100%" }}
        >
          <img
            ref={imgRef}
            src={displayImage} // Mostramos siempre la imagen maestra
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "50vh",
              width: "auto",
              height: "auto",
            }}
            alt="Crop preview"
          />
        </ReactCrop>
      ) : (
        <img
          src={displayImage} // Mostramos siempre la imagen maestra
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