export default function(pathData) {
  var reducedPathData = [];
  var lastType = null;

  var lastControlX = null;
  var lastControlY = null;

  var currentX = null;
  var currentY = null;

  var subpathX = null;
  var subpathY = null;

  pathData.forEach( function(seg) {
    if (seg.type === "M") {
      var x = seg.values[0];
      var y = seg.values[1];

      reducedPathData.push({type: "M", values: [x, y]});

      subpathX = x;
      subpathY = y;

      currentX = x;
      currentY = y;
    }

    else if (seg.type === "C") {
      var x1 = seg.values[0];
      var y1 = seg.values[1];
      var x2 = seg.values[2];
      var y2 = seg.values[3];
      var x = seg.values[4];
      var y = seg.values[5];

      reducedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

      lastControlX = x2;
      lastControlY = y2;

      currentX = x;
      currentY = y;
    }

    else if (seg.type === "L") {
      var x = seg.values[0];
      var y = seg.values[1];

      reducedPathData.push({type: "L", values: [x, y]});

      currentX = x;
      currentY = y;
    }

    else if (seg.type === "H") {
      var x = seg.values[0];

      reducedPathData.push({type: "L", values: [x, currentY]});

      currentX = x;
    }

    else if (seg.type === "V") {
      var y = seg.values[0];

      reducedPathData.push({type: "L", values: [currentX, y]});

      currentY = y;
    }

    else if (seg.type === "S") {
      var x2 = seg.values[0];
      var y2 = seg.values[1];
      var x = seg.values[2];
      var y = seg.values[3];

      var cx1, cy1;

      if (lastType === "C" || lastType === "S") {
        cx1 = currentX + (currentX - lastControlX);
        cy1 = currentY + (currentY - lastControlY);
      }
      else {
        cx1 = currentX;
        cy1 = currentY;
      }

      reducedPathData.push({type: "C", values: [cx1, cy1, x2, y2, x, y]});

      lastControlX = x2;
      lastControlY = y2;

      currentX = x;
      currentY = y;
    }

    else if (seg.type === "T") {
      var x = seg.values[0];
      var y = seg.values[1];

      var x1, y1;

      if (lastType === "Q" || lastType === "T") {
        x1 = currentX + (currentX - lastControlX);
        y1 = currentY + (currentY - lastControlY);
      }
      else {
        x1 = currentX;
        y1 = currentY;
      }

      var cx1 = currentX + 2 * (x1 - currentX) / 3;
      var cy1 = currentY + 2 * (y1 - currentY) / 3;
      var cx2 = x + 2 * (x1 - x) / 3;
      var cy2 = y + 2 * (y1 - y) / 3;

      reducedPathData.push({type: "C", values: [cx1, cy1, cx2, cy2, x, y]});

      lastControlX = x1;
      lastControlY = y1;

      currentX = x;
      currentY = y;
    }

    else if (seg.type === "Q") {
      var x1 = seg.values[0];
      var y1 = seg.values[1];
      var x = seg.values[2];
      var y = seg.values[3];

      var cx1 = currentX + 2 * (x1 - currentX) / 3;
      var cy1 = currentY + 2 * (y1 - currentY) / 3;
      var cx2 = x + 2 * (x1 - x) / 3;
      var cy2 = y + 2 * (y1 - y) / 3;

      reducedPathData.push({type: "C", values: [cx1, cy1, cx2, cy2, x, y]});

      lastControlX = x1;
      lastControlY = y1;

      currentX = x;
      currentY = y;
    }

    else if (seg.type === "A") {
      var r1 = Math.abs(seg.values[0]);
      var r2 = Math.abs(seg.values[1]);
      var angle = seg.values[2];
      var largeArcFlag = seg.values[3];
      var sweepFlag = seg.values[4];
      var x = seg.values[5];
      var y = seg.values[6];

      if (r1 === 0 || r2 === 0) {
        reducedPathData.push({type: "C", values: [currentX, currentY, x, y, x, y]});

        currentX = x;
        currentY = y;
      }
      else {
        if (currentX !== x || currentY !== y) {
          var curves = arcToCubicCurves(currentX, currentY, x, y, r1, r2, angle, largeArcFlag, sweepFlag);

          curves.forEach( function(curve) {
            reducedPathData.push({type: "C", values: curve});
          });

          currentX = x;
          currentY = y;
        }
      }
    }

    else if (seg.type === "Z") {
      reducedPathData.push(seg);

      currentX = subpathX;
      currentY = subpathY;
    }

    lastType = seg.type;
  });

  return reducedPathData;
}

function degToRad(degrees) {
  return (Math.PI * degrees) / 180;
}

function rotate(x, y, angleRad) {
  var X = x * Math.cos(angleRad) - y * Math.sin(angleRad);
  var Y = x * Math.sin(angleRad) + y * Math.cos(angleRad);
  return {x: X, y: Y};
}

function arcToCubicCurves(x1, y1, x2, y2, r1, r2, angle, largeArcFlag, sweepFlag, _recursive) {

  var angleRad = degToRad(angle);
  var params = [];
  var f1, f2, cx, cy;

  if (_recursive) {
    f1 = _recursive[0];
    f2 = _recursive[1];
    cx = _recursive[2];
    cy = _recursive[3];
  }
  else {
    var p1 = rotate(x1, y1, -angleRad);
    x1 = p1.x;
    y1 = p1.y;

    var p2 = rotate(x2, y2, -angleRad);
    x2 = p2.x;
    y2 = p2.y;

    var x = (x1 - x2) / 2;
    var y = (y1 - y2) / 2;
    var h = (x * x) / (r1 * r1) + (y * y) / (r2 * r2);

    if (h > 1) {
      h = Math.sqrt(h);
      r1 = h * r1;
      r2 = h * r2;
    }

    var sign;

    if (largeArcFlag === sweepFlag) {
      sign = -1;
    }
    else {
      sign = 1;
    }

    var r1Pow = r1 * r1;
    var r2Pow = r2 * r2;

    var left = r1Pow * r2Pow - r1Pow * y * y - r2Pow * x * x;
    var right = r1Pow * y * y + r2Pow * x * x;

    var k = sign * Math.sqrt(Math.abs(left/right));

    cx = k * r1 * y / r2 + (x1 + x2) / 2;
    cy = k * -r2 * x / r1 + (y1 + y2) / 2;

    f1 = Math.asin(parseFloat(((y1 - cy) / r2).toFixed(9)));
    f2 = Math.asin(parseFloat(((y2 - cy) / r2).toFixed(9)));

    if (x1 < cx) {
      f1 = Math.PI - f1;
    }
    if (x2 < cx) {
      f2 = Math.PI - f2;
    }

    if (f1 < 0) {
      f1 = Math.PI * 2 + f1;
    }
    if (f2 < 0) {
      f2 = Math.PI * 2 + f2;
    }

    if (sweepFlag && f1 > f2) {
      f1 = f1 - Math.PI * 2;
    }
    if (!sweepFlag && f2 > f1) {
      f2 = f2 - Math.PI * 2;
    }
  }

  var df = f2 - f1;

  if (Math.abs(df) > (Math.PI * 120 / 180)) {
    var f2old = f2;
    var x2old = x2;
    var y2old = y2;

    if (sweepFlag && f2 > f1) {
      f2 = f1 + (Math.PI * 120 / 180) * (1);
    }
    else {
      f2 = f1 + (Math.PI * 120 / 180) * (-1);
    }

    x2 = cx + r1 * Math.cos(f2);
    y2 = cy + r2 * Math.sin(f2);
    params = arcToCubicCurves(x2, y2, x2old, y2old, r1, r2, angle, 0, sweepFlag, [f2, f2old, cx, cy]);
  }

  df = f2 - f1;

  var c1 = Math.cos(f1);
  var s1 = Math.sin(f1);
  var c2 = Math.cos(f2);
  var s2 = Math.sin(f2);
  var t = Math.tan(df / 4);
  var hx = 4 / 3 * r1 * t;
  var hy = 4 / 3 * r2 * t;

  var m1 = [x1, y1];
  var m2 = [x1 + hx * s1, y1 - hy * c1];
  var m3 = [x2 + hx * s2, y2 - hy * c2];
  var m4 = [x2, y2];

  m2[0] = 2 * m1[0] - m2[0];
  m2[1] = 2 * m1[1] - m2[1];

  if (_recursive) {
    return [m2, m3, m4].concat(params);
  }
  else {
    params = [m2, m3, m4].concat(params);

    var curves = [];

    for (var i = 0; i < params.length; i+=3) {
      var r1 = rotate(params[i][0], params[i][1], angleRad);
      var r2 = rotate(params[i+1][0], params[i+1][1], angleRad);
      var r3 = rotate(params[i+2][0], params[i+2][1], angleRad);
      curves.push([r1.x, r1.y, r2.x, r2.y, r3.x, r3.y]);
    }

    return curves;
  }
}
