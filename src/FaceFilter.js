import './App.css';
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import Webcam from 'react-webcam';
import { useCallback, useEffect, useRef } from 'react';
import Mouth from './mouth.svg';
import Paper from 'paper';
import { findFirstItemWithPrefix, bindSkeletonToIllustration, findMouth, constructMouthBones, getTotalBoneLength, updateMouthSkinnedPath, drawMouth } from './utilities';

const MIN_CONFIDENCE_PATH_SCORE = 0.3;

// http://localhost:3002/
// https://www.youtube.com/watch?v=7lXYGDVHUNw&ab_channel=NicholasRenotte

function FaceFilter() {
  const webcamRef = useRef();
  const canvasRef = useRef();

  const mouthBonesRef = useRef();
  const skinnedPathsRef = useRef();
  const moustLen0Ref = useRef();

  // const [mouthBones, setMouthBones] = useState();
  // const [skinnedPaths, setSkinnedPaths] = useState();
  
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

      const canvas = canvasRef.current;
      Paper.setup(canvas);

      // Make detections
      const face = await net.estimateFaces({ input: video });

      // Get canvas context for drawing
      const ctx = canvasRef.current.getContext("2d");
      // Sanity check if face exists
      requestAnimationFrame(() => {
        const updatedSkinnedPath = updateMouthSkinnedPath(face, skinnedPathsRef.current, mouthBonesRef.current, moustLen0Ref.current);
        // drawMouth(updatedSkinnedPath);

        updatedSkinnedPath.forEach((skinnedPath) => {
          if (!skinnedPath.confidenceScore || skinnedPath.confidenceScore < MIN_CONFIDENCE_PATH_SCORE) {
            return;
          }
      
          let path = new Paper.Path({
            fillColor: skinnedPath.fillColor,
            strokeColor: skinnedPath.strokeColor,
            strokeWidth: skinnedPath.strokeWidth,
            closed: skinnedPath.closed,
          });
      
          skinnedPath.segments.forEach((seg) => {
            path.addSegment(
              seg.point.currentPosition,
              seg.handleIn ? seg.handleIn.currentPosition.subtract(seg.point.currentPosition) : null,
              seg.handleOut ? seg.handleOut.currentPosition.subtract(seg.point.currentPosition) : null
            )
          });
          if (skinnedPath.closed) {
            path.closePath();
          }
          Paper.view.draw();
        })
      });
    }
  }, []);

  // Load facemesh
  const runFacemesh = useCallback(async () => {
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    setInterval(() => {
      detect(net);
    }, 100);
  }, [detect]);

  useEffect(() => {

    // const drawLine = (color, direction) => {
    //   const path = new Paper.Path();
    //   path.strokeColor = color;
    //   const start = new Point(100, 100);
    //   path.moveTo(start);
    //   path.lineTo(start.add(direction));
    //   Paper.view.draw();
    // }

    // drawLine('black', [50, -50]);
    // drawLine('red', [-50, -50]);

    runFacemesh();
  }, [runFacemesh]);

  const importSvg = useCallback((file) => {
    let svgScope = new Paper.PaperScope();
    let canvas = svgScope.createCanvas(0, 0);
    svgScope.setup(canvas);
    return new Promise((resolve, reject) => {
      svgScope.project.importSVG(
        file,
        () => {
          console.log('** SVG imported **');
          resolve(svgScope);
        },
        (e) => {
          console.log('** SVG improt error: ', e);
          reject(svgScope);
        }
      );
    })
  }, []);

  useEffect(async () => {
    const svgScope = await importSvg(Mouth);
    const skeleton = findFirstItemWithPrefix(svgScope.project, 'skeleton');
    const mouth = findFirstItemWithPrefix(svgScope.project, 'illustration');

    const mouthSkeletonPoints = findMouth(skeleton);
    const mouthBones = constructMouthBones(mouthSkeletonPoints);
    mouthBonesRef.current = mouthBones;

    // define mouthLen0
    const mouthLen0 = getTotalBoneLength(mouthBones);
    moustLen0Ref.current = mouthLen0;

    // TODO: this.faceLen0 = this.getTotalBoneLength(this.faceBones); in skeleton.js
    //setMouthBones(mouthBones);

    const skinnedPaths = bindSkeletonToIllustration(mouthBones, mouth, svgScope);
    skinnedPathsRef.current = skinnedPaths;
    //setSkinnedPaths(skinnedPaths);
  }, [importSvg]);
  
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

export default FaceFilter;
