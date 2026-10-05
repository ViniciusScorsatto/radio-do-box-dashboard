import { Composition, registerRoot } from "remotion";
import {
  ShortVideo,
  videoMetadata,
  shortDuration,
  type ShortProps,
} from "./ShortVideo";
registerRoot(() => (
  <Composition
    id="OnlineShort"
    component={ShortVideo}
    {...videoMetadata}
    calculateMetadata={({ props }: { props: ShortProps }) => ({
      durationInFrames: shortDuration(props.job),
    })}
  />
));
