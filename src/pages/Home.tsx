import { ImgGrid } from "../components/ImgGrid";
import img1 from '../assets/img/img1.png';
import img2 from '../assets/img/img2.png';
import img3 from '../assets/img/img3.png';
import img4 from '../assets/img/img4.png';
import Editor from "../components/Editor";
import { useModal } from "../components/useModal";

const imgs = [
    img1,
    img2,
    img3,
    img4
];

const Home = () => {
    const {
        editorImage,
        openEditor,
        closeModals
    } = useModal();

    return (
        <div className="min-h-screen max-w-[70vw] flex flex-col justify-center items-center bg-black">
            {editorImage && (
                <Editor
                    image={editorImage}
                    onClose={closeModals}
                />
            )}

            <br />
            <ImgGrid
                images={imgs}
                openEditor={openEditor}
            />
        </div>
    );
};

export default Home;