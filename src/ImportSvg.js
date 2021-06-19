import Mouth from './mouth.svg';
import Paper from 'paper';
import { useCallback, useEffect } from 'react';
import { findFirstItemWithPrefix, findMouth, bindSkeletonToIllustration } from './utilities';

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
    const mouthSkeletonPoints = findMouth(skeleton);

    // console.log('mouth: ', mouth);
    console.log('mouthSkeletonPoints: ', mouthSkeletonPoints);
    bindSkeletonToIllustration(skeleton, mouth);
  }, [importSvg]);

  return (
    <div>Import Svg</div>
  )
}

export default ImportSvg;
