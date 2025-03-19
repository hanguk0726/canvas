import { ImgGrid } from "../components/ImgGrid";
import img1 from "../assets/img/img1.png";
import img2 from "../assets/img/img2.png";
import img3 from "../assets/img/img3.png";
import img4 from "../assets/img/img4.png";
import Editor from "../components/Editor";
import { useModal } from "../components/useModal";
import CubicBezierCanvas from "../components/cubicBezierCanvas/CubicBezierCanvas";
import DynamicAttachedBezierEditor from "../components/cubicBezierCanvas/CubicBezierCanvas";

const imgs = [img1, img2, img3, img4];

const Home = () => {
  return (
    <div>
      <DynamicAttachedBezierEditor />
    </div>
  );
};

export default Home;
