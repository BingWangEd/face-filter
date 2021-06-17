import Mouth from './mouth.svg';
import Paper from 'paper';
import { useCallback, useEffect } from 'react';

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
    const skeleton = svgScope.project._children[0].children.mouth._children[1];
    const mouth = svgScope.project._children[0].children.mouth._children[2];
    console.log('skeleton: ', skeleton);
    console.log('mouth: ', mouth);
  }, [importSvg])

  return (
    <div>Import Svg</div>
  )
}

export default ImportSvg;
