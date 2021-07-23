import Paper from 'paper';

const MIN_FACE_CONFIDENCE_SCORE = 0.8;

// Draw triangle

// Draw the points
// ctx: canvas
export const drawMesh = (predictions, ctx) => {
  if (predictions.length > 0) {
    predictions.forEach(prediction => {
      const keypoints = prediction.scaledMesh;

      // Draw dots
      keypoints.forEach((keypoint) => {
        const x = keypoint[0];
        const y = keypoint[1];
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 3 * Math.PI);
        ctx.fillStyle = "aqua";
        ctx.fill();
      });
    });
  }
}

export const findFirstItemWithPrefix = (root, prefix) => {
  // Fetch the descendants (children or children of children) of this item
  // that match the properties in the specified object. 
  let items = root.getItems({ recursive: true });
  for (let i = 0; i < items.length; i++) {
    if (items[i].name && items[i].name.startsWith(prefix)) {
    return items[i];
    }
  }
  return null;
}

const MOUTH_POINTS = [
  'leftMouthCorner', 'leftUpperLipTop0', 'leftUpperLipTop1', 'upperLipTopMid', 'rightMouthCorner',
  'rightUpperLipTop0', 'rightUpperLipTop1', 'rightMiddleLip', 'rightUpperLipBottom1', 'leftMiddleLip',
  'leftUpperLipBottom1', 'upperLipBottomMid', 'rightLowerLipTop0', 'leftLowerLipTop0', 'lowerLipTopMid',
  'rightLowerLipBottom0', 'rightLowerLipBottom1', 'leftLowerLipBottom0', 'leftLowerLipBottom1', 'lowerLipBottomMid',
]

const MOUTH_BONES = {
  bLeftMouthCornerLeftUpperLipTop0: ['leftMouthCorner', 'leftUpperLipTop0'],
  bLeftUpperLipTop0LeftUpperLipTop1: ['leftUpperLipTop0', 'leftUpperLipTop1'],
  bLeftUpperLipTop1UpperLipTopMid: ['leftUpperLipTop1', 'upperLipTopMid'],
  bRigthMouthCornerRigthUpperLipTop0: ['rightMouthCorner', 'rightUpperLipTop0'],
  bRigthUpperLipTop0RigthUpperLipTop1: ['rightUpperLipTop0', 'rightUpperLipTop1'],
  bRigthUpperLipTop1UpperLipTopMid: ['rightUpperLipTop1', 'upperLipTopMid'],
  bLeftMouthCornerLeftMiddleLip: ['leftMouthCorner', 'leftMiddleLip'],
  bLeftMiddleLipLeftUpperLipBottom1: ['leftMiddleLip', 'leftUpperLipBottom1'],
  bLeftUpperLipBottom1UpperLipBottomMid: ['leftUpperLipBottom1', 'upperLipBottomMid'],
  bRightMouthCornerRightMiddleLip: ['rightMouthCorner', 'rightMiddleLip'],
  bRightMiddleLipRightUpperLipBottom1: ['rightMiddleLip', 'rightUpperLipBottom1'],
  bRightUpperLipBottom1UpperLipBototmMid: ['rightUpperLipBottom1', 'upperLipBottomMid'],
  bLeftMiddleLipLeftLowerLipTop0: ['leftMiddleLip', 'leftLowerLipTop0'],
  bLeftLowerLipTop0LowerLipTopMid: ['leftLowerLipTop0', 'lowerLipTopMid'],
  bRightMiddleLipRightLowerLipTop0: ['rightMiddleLip', 'rightLowerLipTop0'],
  bRightLowerLipTop0LowerLipTopMid: ['rightLowerLipTop0', 'lowerLipTopMid'],
  bLeftMouthCornerLeftLowerLipBottom0: ['leftMouthCorner', 'leftLowerLipBottom0'],
  bLeftLowerLipBottom0LeftLowerLipBottom1: ['leftLowerLipBottom0', 'leftLowerLipBottom1'],
  bLeftLowerLipBottom1LowerLipBottomMid: ['leftLowerLipBottom1', 'lowerLipBottomMid'],
  bRightMouthCornerRightLowerLipBottom0: ['rightMouthCorner', 'rightLowerLipBottom0'],
  bRightLowerLipBottom0RightLowerLipBottom1: ['rightLowerLipBottom0', 'rightLowerLipBottom1'],
  bRightLowerLipBottom1LowerLipBottomMid: ['rightLowerLipBottom1', 'lowerLipBottomMid'],
}

export const findMouth = (root) => {
  let mouthPoints = {} // { leftUpperLipBottom1: Point {_x: 635.6, _y: 261.6, _owner: Rectangle, _setter: "setCenter"}}
  MOUTH_POINTS.forEach((point) => {
    const path = findFirstItemWithPrefix(root, point);
    mouthPoints[point] = path.bounds.center;
  })
  return mouthPoints;
}

// 
export const constructMouthBones = (mouthPoints) => {
  let mouthBones = {};
  // old: { bLeftMouthCornerLeftLowerLipBottom0: [point0, point1]}
  // new: {bLeftMouthCornerLeftLowerLipBottom0: {
  //   name: 'LeftMouthCorner-LeftLowerLipBottom',
  //   kp0: point0,
  //   kp1: point1,
  // }}
  Object.keys(MOUTH_BONES).forEach((bone) => {
    const [k0, k1] = MOUTH_BONES[bone];
    if (!k0 || !k1) return;
    mouthBones[bone] = {
      name: `${k0}-${k1}`,
      kp0: mouthPoints[k0],
      kp1: mouthPoints[k1],
    };
  });
  return mouthBones;
}

const isPath = (item) => {
  return item.constructor === item.project._scope.Path;
}

const isShape = (item) => {
  return item.constructor === item.project._scope.Shape;
}

const isGroup = (item) => {
  return item.constructor === item.project._scope.Group;
}

export const bindSkeletonToIllustration = (mouthBones, illustrationPaths, scope) => {
  let items = illustrationPaths; // [mouthPath]
  if (isGroup(illustrationPaths)) {
    items = illustrationPaths.getItems({recursive: true});
  }

  // console.log('items: ', items);
  const skinnedPaths = [];
  items.forEach((path) => { // one path;
    const segs = []; // four segs

    path.segments.forEach((seg) => {
      // TODO: Adds collinear situation
      const weights = getWeights(seg.point, mouthBones);
      // weights: { bLeftMouthCornerLeftLowerLipBottom0: {
      //     value: 0.**, bone: [point0, point1], name: bLeftMouthCornerLeftLowerLipBottom0
      //   }
      // }
      let segment = {
        point: getSkinning(seg.point, weights, scope)
      }
      // point: {
      //   skinning: {
      //     bLeftMouthCornerLeftLowerLipBottom0: {
      //       bone: [point0, point1],
      //       weight: 0.**,
      //       transform: {
      //          transform: Point, // p + transform = closest point from p to bone
      //          anchorPerc, // number between 0 to 1
      //     }
      //     ...
      //   },
      //   position: Point, // current segment point
      //   currentPosition: Point(0, 0),
      // }

      // For handles, compute transformation in world space.
      if (seg.handleIn) {
        let pHandleIn = seg.handleIn.add(seg.point);
        segment.handleIn = getSkinning(pHandleIn, getWeights(pHandleIn, mouthBones), scope);
      }
      if (seg.handleOut) {
        let pHandleOut = seg.handleOut.add(seg.point);
        segment.handleOut = getSkinning(pHandleOut, getWeights(pHandleOut, mouthBones), scope);
      }
      segs.push(segment);
      return segment;
    });

    skinnedPaths.push({
      segments: segs, 
      fillColor: path.fillColor,
      strokeColor: path.strokeColor,
      strokeWidth: path.strokeWidth,
      closed: path.closed
    });
  });

  return skinnedPaths;
}

const getWeights = (point, bones) => {
  let totalW = 0;
  let weights = {};
  Object.keys(bones).forEach(bone => {
      const { kp0, kp1 } = bones[bone];
      let d = getClosestPointOnSegment(kp0, kp1, point)
          .getDistance(point);
      // Absolute weight = 1 / (distance * distance)
      let w = 1 / (d * d);
      weights[bone] = {
          value: w,
          bone: bones[bone],
          name: bone,
      }
  });

  let values = Object.values(weights).sort((v0, v1) => {
      return v1.value - v0.value;
  });

  weights = {};
  totalW = 0;
  values.forEach(v => {
      weights[v.name] = v;
      totalW += v.value;
  });

  if (totalW === 0) {
      // Point is outside of the influence zone of all bones. It will not be influence by any bone.
      return {};
  }

  // Normalize weights to sum up to 1.
  Object.values(weights).forEach(weight => {
      weight.value /= totalW;
  });

  return weights;
}

const getClosestPointOnSegment = (p0, p1, p) => {
  let d = p1.subtract(p0);
  let c = p.subtract(p0).dot(d) / (d.dot(d));
  if (c >= 1) {
      return p1.clone();
  } else if (c <= 0) {
      return p0.clone();
  } else {
    return p0.add(d.multiply(c));
  }
}

const getSkinning = (point, weights, scope) => {
  let skinning = {};
  Object.keys(weights).forEach(boneName => {
      const { kp0, kp1 } = weights[boneName].bone;
      skinning[boneName] = {
          bone: weights[boneName].bone,
          weight: weights[boneName].value,
          transform: getPointTransform(point, kp0, kp1),
      };
  });
  return {
      skinning: skinning,
      position: point,
      currentPosition: new scope.Point(0, 0),
  }
};

/// Finds a point's bone transform.
// Let anchor be the closest point on the bone to the point.
// A point's bone transformation is the transformation from anchor to the point.
const getPointTransform = (p, kp0, kp1) => {
  // get the slope of the bone
  let dir = kp1.subtract(kp0).normalize();
  
  let n = dir.clone();
  n.angle += 90; // get the angle verticle to the bone
  
  let closestP = getClosestPointOnSegment(kp0, kp1, p);
  let v = p.subtract(closestP);
  let dirProjD = v.dot(dir);
  let dirProjN = v.dot(n);
  
  let d = kp0.subtract(kp1).length;
  let anchorPerc = closestP.subtract(kp0).length / d;

  // console.log('kp0: ', kp0);
  // console.log('kp1: ', kp1);
  // console.log('p: ', p);
  // console.log('dir: ', dir);
  // console.log('n: ', n);
  // console.log('closestP: ', closestP);
  // console.log('v: ', v);
  // console.log('dirProjD: ', dirProjD);
  // console.log('dirProjN: ', dirProjN);
  // console.log('anchorPerc: ', anchorPerc);
  return {
      // p + transform will be the closet spot on the bone
      transform: new Paper.Point(dirProjD, dirProjN), // paper.default.point
      anchorPerc, // what is anchorPerc?
  };
}

const mousePartNames = [
  'rightMouthCorner', 'rightUpperLipTop0', 'rightUpperLipTop1', 'upperLipTopMid', 'leftUpperLipTop1', 'leftUpperLipTop0', 'leftMouthCorner', // 48 - 54
  'leftLowerLipBottom0', 'leftLowerLipBottom1', 'lowerLipBottomMid', 'rightLowerLipBottom1', 'rightLowerLipBottom0', // 55 - 59
  'rightMiddleLip', 'rightUpperLipBottom1', 'upperLipBottomMid', 'leftUpperLipBottom1', 'leftMiddleLip', // 60 - 64
  'leftLowerLipTop0', 'lowerLipTopMid', 'rightLowerLipTop0', // 65 - 67
];

export const facePartName2Index = {
  'topMid': 10,
  'rightTop0': 67,
  'rightTop1': 54,
  'leftTop0': 297,
  'leftTop1': 284,
  'rightJaw0': 21,
  'rightJaw1': 162,
  'rightJaw2': 127, 
  'rightJaw3': 234,
  'rightJaw4': 132, 
  'rightJaw5': 172, 
  'rightJaw6': 150,
  'rightJaw7': 176,
  'jawMid': 152,   // 0 - 8
  'leftJaw7': 400, 
  'leftJaw6': 379, 
  'leftJaw5': 397, 
  'leftJaw4': 361,
  'leftJaw3': 454,
  'leftJaw2': 356,
  'leftJaw1': 389,
  'leftJaw0': 251, // 9 - 16
  'rightBrow0': 46, 
  'rightBrow1': 53, 
  'rightBrow2': 52,
  'rightBrow3': 65,
  'rightBrow4': 55, // 17 - 21
  'leftBrow4': 285,
  'leftBrow3': 295, 
  'leftBrow2': 282,
  'leftBrow1': 283,
  'leftBrow0': 276, // 22 - 26
  'nose0': 6,
  'nose1': 197,
  'nose2': 195,
  'nose3': 5, // 27 - 30
  'rightNose0': 48,
  'rightNose1': 220,
  'nose4': 4, 
  'leftNose1': 440,
  'leftNose0': 278, // 31 - 35
  'rightEye0': 33,
  'rightEye1': 160,
  'rightEye2': 158,
  'rightEye3': 133,
  'rightEye4': 153,
  'rightEye5': 144, // 36 - 41
  'leftEye3': 362,
  'leftEye2': 385,
  'leftEye1': 387,
  'leftEye0': 263,
  'leftEye5': 373, 
  'leftEye4': 380, // 42 - 47
  'rightMouthCorner': 61,
  'rightUpperLipTop0': 40,
  'rightUpperLipTop1': 37,
  'upperLipTopMid': 0,
  'leftUpperLipTop1': 267,
  'leftUpperLipTop0': 270,
  'leftMouthCorner': 291, // 48 - 54
  'leftLowerLipBottom0': 321,
  'leftLowerLipBottom1': 314,
  'lowerLipBottomMid': 17,
  'rightLowerLipBottom1': 84,
  'rightLowerLipBottom0': 91, // 55 - 59
  'rightMiddleLip': 78,
  'rightUpperLipBottom1': 81,
  'upperLipBottomMid': 13,
  'leftUpperLipBottom1': 311,
  'leftMiddleLip': 308, // 60 - 64
  'leftLowerLipTop0': 402, 
  'lowerLipTopMid': 14,
  'rightLowerLipTop0': 178, // 65 - 67
};

export const toMouthFrame = (faceDetection) => {
  let frame = {
    positions: [],
    faceInViewConfidence: faceDetection.faceInViewConfidence,
  }

  mousePartNames.forEach((mousePartName) => {
    let p = faceDetection.scaledMesh[facePartName2Index[mousePartName]]
    frame.positions.push(p[0]);
    frame.positions.push(p[1]);
    // not sure why it does not push a tuple
    // eg. frame.positions.push([p[0], p[1]]);
  })
  return frame;
}

// facePrediction
// {
//   anootations: { leftCheek: [[x, y, z], ...], ... },
//   boundingBox: { ... },
//   mesh: [...],
//   scaleMesh: [[x, y, z], ...]
// }

// face
// {
//   faceInViewConfidence: 0.5,
//   positions: [ number, ...]
// }

// Corresponds to updateFaceParts
const updateMouthSkeletonParts = (mouthFrame) => {
  let parts = {};
  if (mouthFrame && mouthFrame.positions && mouthFrame.positions.length && mouthFrame.faceInViewConfidence > MIN_FACE_CONFIDENCE_SCORE) {
    mousePartNames.forEach((mousePartName, index) => {
      let pos = getKeypointFromMouthFrame(mouthFrame, index);
      if (!pos) return;
      parts[mousePartName] = {
        position: pos,
        score: mouthFrame.faceInViewConfidence
      }
    });
  }
  return parts;
}

// Corresponds to update
const updateMouth = (mouthFrame, mouthBones) => {
  // Correspods to this.isValid = this.updateFaceParts(face); in skeleton.js
  const updatedMouthParts = updateMouthSkeletonParts(mouthFrame);

  // console.log('mouthBones: ', mouthBones);
  console.log('updatedMouthParts: ', updatedMouthParts);
  // Update bones (currentPosition)
  Object.keys(mouthBones).forEach((boneName) => {
    const bone = mouthBones[boneName];
    console.log('bone: ', bone);
    console.log('bone.kp0.name: ', bone.kp0.name);
    // let part0 = updatedMouthParts[bone.kp0.name];
    // let part1 = updatedMouthParts[bone.kp1.name];
    // bone.kp0.currentPosition = part0.position;
    // bone.kp1.currentPosition = part1.position;
    // bone.score = (part0.score + part1.score) / 2;
    // bone.latestCenter = bone.kp1.currentPosition.add(bone.kp0.currentPosition).divide(2);
  })
  console.log('mouthBones now: ', mouthBones);
}

const getKeypointFromMouthFrame = (mouth, i) => {
  return new Paper.Point(mouth.positions[i * 2], mouth.positions[i * 2 + 1]);
}

// bone.transform
const transformBone = (bone, trans) => {
  const [kp0, kp1] = bone;
  console.log('bone: ', bone);
  if (!kp1.currentPosition || !kp0.currentPosition) {
      return;
  }
  // Scale distance from anchor point base on bone type.
  // All face bones will share one distance scale. All body bones share another.
  let dir = kp1.currentPosition.subtract(kp0.currentPosition).normalize();
  let n = dir.clone();
  n.angle += 90;
  let anchor = kp0.currentPosition.multiply(1 - trans.anchorPerc).add(kp1.currentPosition.multiply(trans.anchorPerc));
  let p = anchor.add(dir.multiply(trans.transform.x)).add(n.multiply(trans.transform.y));
  // TODO: implement face scale
  // let p = anchor.add(dir.multiply(trans.transform.x * currentFaceScale)).add(n.multiply(trans.transform.y * currentFaceScale));
  return p;
}

// Finds a point's current position from the current bone position.
const getCurrentPosition = (segment) => {
  let position = new Paper.Point();
  Object.keys(segment.skinning).forEach(boneName => {
      let bt = segment.skinning[boneName];
      // here implement transform
      // error: bt.bone.transform is not a function
      // position = position.add(transformBone(bt.bone, bt.transform).multiply(bt.weight));
  });
  return position;
}

// Draw the facefilter
// ctx: canvas
export const drawMouth = (facePredictions, ctx, skinnedPaths, mouthBones) => {
  if (!facePredictions || facePredictions.length < 1) return;
  let mouthFrame = toMouthFrame(facePredictions[0]);

  // Corresponds to updateFaceParts
  const newMoutSkeleton = updateMouth(mouthFrame, mouthBones);
  
  console.log('newMoutSkeleton: ', newMoutSkeleton);

  let getConfidenceScore = (p) => {
    return Object.keys(p.skinning).reduce((totalScore, boneName) => {
      let bt = p.skinning[boneName];
      return totalScore + bt.bone.score * bt.weight;
    }, 0);
  }

  // skinnedPaths.forEach((skinnedPath) => {
  //   console.log('before >>>>>')
  //   console.log(skinnedPath)
  //   let confidenceScore = 0;
  //   skinnedPath.segments.forEach(seg => {
  //     // Compute confidence score.
  //     confidenceScore += getConfidenceScore(seg.point);
  //     // Compute new positions for curve point and handles.
  //     seg.point.currentPosition = getCurrentPosition(seg.point);
  //     if (seg.handleIn) {
  //       seg.handleIn.currentPosition = getCurrentPosition(seg.handleIn);
  //     }
  //     if (seg.handleOut) {
  //       seg.handleOut.currentPosition = getCurrentPosition(seg.handleOut);
  //     }
  //   });
  //   console.log('after >>>>>')
  //   console.log(skinnedPath)
  //   return skinnedPath;
  // });

  // if (predictions.length > 0) {
  //   predictions.forEach(prediction => {
  //     const keypoints = prediction.scaledMesh;

  //     // Draw dots
  //     keypoints.forEach((keypoint) => {
  //       const x = keypoint[0];
  //       const y = keypoint[1];
  //       ctx.beginPath();
  //       ctx.arc(x, y, 1, 0, 3 * Math.PI);
  //       ctx.fillStyle = "aqua";
  //       ctx.fill();
  //     });
  //   });
  // }
}