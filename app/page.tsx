import { JoystickAppComponent } from "@/components/joystick-app";
import WebcamAiChat from "@/components/webcam-ai-chat";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid lg:grid-cols-[4fr_1fr] md:grid-cols-[3fr_1fr] grid-rows-2 p-5">
      <WebcamAiChat />
      <JoystickAppComponent />
    </div>
  );
}
