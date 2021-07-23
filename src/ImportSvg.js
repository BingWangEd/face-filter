import Mouth from './mouth.svg';
import Paper from 'paper';
import { useCallback, useEffect } from 'react';
import { findFirstItemWithPrefix, bindSkeletonToIllustration, findMouth, constructMouthBones } from './utilities';
import CameraCanvas from './CameraCanvas';

const ImportSvg = () => {
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

    // mouthBones:
    // { bLeftMouthCornerLeftLowerLipBottom0: [point0, point1]}
    const mouthSkeletonPoints = findMouth(skeleton);
    const mouthBones = constructMouthBones(mouthSkeletonPoints);
    const skinnedPaths = bindSkeletonToIllustration(mouthBones, mouth, svgScope);
  }, [importSvg]);

  return (
    <CameraCanvas />
  )
}

export default ImportSvg;
