import { HeroCertifications } from "../features/certificaciones/components/HeroCertifications";
import { ImageUploader } from "../features/certificaciones/components/ImageUploader";


export default function About() {
  return (
    <section id="center">
      <div className="p-2 space-y-6 w-full">
        <HeroCertifications />
          <div>
            <h3 className="text-sm font-medium-ui mb-3 text-dark-500  font-bold-ui text-left">
              Categorías
            </h3>
            {/*<CategoryAddCard />*/}
          </div>
          <h6 className="text-center text-4xl text-dark-500 tracking-widest font-semibold-ui">
            CERTIFICACIONES
          </h6>
      </div>

      <ImageUploader></ImageUploader>
    </section>
  )
}
