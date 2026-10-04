import { Composition, registerRoot } from "remotion";
import { ShortVideo, videoMetadata } from "./ShortVideo";
registerRoot(() => (
  <Composition id="OnlineShort" component={ShortVideo} {...videoMetadata} />
));
