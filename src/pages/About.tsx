import { useState } from "react";
import { ImagenUploader } from "../features/certificaciones/components/ImageUploader";
import { Modal } from "../features/certificaciones/components/Modal";
import { Banner } from "../features/certificaciones/components/BannerCertificaciones";



export default function About() {
  const [openModal, setOpenModal] = useState(false);
  
  return (
    <section id="center">
      <div className="p-2 space-y-6 w-full">
        <Banner onOpenModal={() => setOpenModal(true)} />
        <Modal isOpen={openModal} onClose={() => setOpenModal(false)}>
          <ImagenUploader></ImagenUploader>
        </Modal>
      </div>
    </section>
  )
}
