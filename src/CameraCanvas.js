import './App.css';
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import Webcam from 'react-webcam';
import { useCallback, useEffect, useRef } from 'react';
import { drawMesh } from './utilities';

// http://localhost:3002/
// https://www.youtube.com/watch?v=7lXYGDVHUNw&ab_channel=NicholasRenotte

function CameraCanvas() {
  const webcamRef = useRef();
  const canvasRef = useRef();

  // Detect function
  const detect = useCallback(async (net) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      // Get video properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make detections
      const face = await net.estimateFaces({ input: video });

      // Get canvas context for drawing
      const ctx = canvasRef.current.getContext("2d");
      requestAnimationFrame(() => drawMesh(face, ctx));
    }
  }, []);

  // Load facemesh
  const runFacemesh = useCallback(async () => {
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    setInterval(() => {
      detect(net);
    }, 1000);
  }, [detect]);

  useEffect(() => {
    runFacemesh();
  }, [runFacemesh]);
  
  return (
    <div className="App">
      <header className="App-header">
        <Webcam ref={webcamRef} style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 9,
          width: 640,
          height: 480
        }} />
        <canvas ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480
          }}
        />
      </header>
    </div>
  );
}

export default CameraCanvas;
