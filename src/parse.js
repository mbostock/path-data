import absolutize from "./absolutize.js";
import reduce from "./reduce.js";
import Source from "./source.js";

export default function parse(string, {normalize = false} = {}) {
  if (!(string += "") || string.length === 0) return [];
  const source = new Source(string);
  const pathData = [];
  if (source.initialCommandIsMoveTo()) {
    while (source.hasMoreData()) {
      const pathSeg = source.parseSegment();
      if (pathSeg === null) break;
      pathData.push(pathSeg);
    }
  }
  return normalize ? reduce(absolutize(pathData)) : pathData;
}
