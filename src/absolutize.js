export default function absolutize(pathData) {
  var absolutizedPathData = [];

  var currentX = null;
  var currentY = null;

  var subpathX = null;
  var subpathY = null;

  pathData.forEach( function(seg) {
    var type = seg.type;

    if (type === "M") {
      var x = seg.values[0];
      var y = seg.values[1];

      absolutizedPathData.push({type: "M", values: [x, y]});

      subpathX = x;
      subpathY = y;

      currentX = x;
      currentY = y;
    }

    else if (type === "m") {
      var x = currentX + seg.values[0];
      var y = currentY + seg.values[1];

      absolutizedPathData.push({type: "M", values: [x, y]});

      subpathX = x;
      subpathY = y;

      currentX = x;
      currentY = y;
    }

    else if (type === "L") {
      var x = seg.values[0];
      var y = seg.values[1];

      absolutizedPathData.push({type: "L", values: [x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "l") {
      var x = currentX + seg.values[0];
      var y = currentY + seg.values[1];

      absolutizedPathData.push({type: "L", values: [x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "C") {
      var x1 = seg.values[0];
      var y1 = seg.values[1];
      var x2 = seg.values[2];
      var y2 = seg.values[3];
      var x = seg.values[4];
      var y = seg.values[5];

      absolutizedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "c") {
      var x1 = currentX + seg.values[0];
      var y1 = currentY + seg.values[1];
      var x2 = currentX + seg.values[2];
      var y2 = currentY + seg.values[3];
      var x = currentX + seg.values[4];
      var y = currentY + seg.values[5];

      absolutizedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "Q") {
      var x1 = seg.values[0];
      var y1 = seg.values[1];
      var x = seg.values[2];
      var y = seg.values[3];

      absolutizedPathData.push({type: "Q", values: [x1, y1, x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "q") {
      var x1 = currentX + seg.values[0];
      var y1 = currentY + seg.values[1];
      var x = currentX + seg.values[2];
      var y = currentY + seg.values[3];

      absolutizedPathData.push({type: "Q", values: [x1, y1, x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "A") {
      var x = seg.values[5];
      var y = seg.values[6];

      absolutizedPathData.push({
        type: "A",
        values: [seg.values[0], seg.values[1], seg.values[2], seg.values[3], seg.values[4], x, y]
      });

      currentX = x;
      currentY = y;
    }

    else if (type === "a") {
      var x = currentX + seg.values[5];
      var y = currentY + seg.values[6];

      absolutizedPathData.push({
        type: "A",
        values: [seg.values[0], seg.values[1], seg.values[2], seg.values[3], seg.values[4], x, y]
      });

      currentX = x;
      currentY = y;
    }

    else if (type === "H") {
      var x = seg.values[0];
      absolutizedPathData.push({type: "H", values: [x]});
      currentX = x;
    }

    else if (type === "h") {
      var x = currentX + seg.values[0];
      absolutizedPathData.push({type: "H", values: [x]});
      currentX = x;
    }

    else if (type === "V") {
      var y = seg.values[0];
      absolutizedPathData.push({type: "V", values: [y]});
      currentY = y;
    }

    else if (type === "v") {
      var y = currentY + seg.values[0];
      absolutizedPathData.push({type: "V", values: [y]});
      currentY = y;
    }

    else if (type === "S") {
      var x2 = seg.values[0];
      var y2 = seg.values[1];
      var x = seg.values[2];
      var y = seg.values[3];

      absolutizedPathData.push({type: "S", values: [x2, y2, x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "s") {
      var x2 = currentX + seg.values[0];
      var y2 = currentY + seg.values[1];
      var x = currentX + seg.values[2];
      var y = currentY + seg.values[3];

      absolutizedPathData.push({type: "S", values: [x2, y2, x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "T") {
      var x = seg.values[0];
      var y = seg.values[1]

      absolutizedPathData.push({type: "T", values: [x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "t") {
      var x = currentX + seg.values[0];
      var y = currentY + seg.values[1]

      absolutizedPathData.push({type: "T", values: [x, y]});

      currentX = x;
      currentY = y;
    }

    else if (type === "Z" || type === "z") {
      absolutizedPathData.push({type: "Z", values: []});

      currentX = subpathX;
      currentY = subpathY;
    }
  });

  return absolutizedPathData;
}
