import {staticFile} from 'remotion';

export const RADIO_IMPACT_FONT = '"Barlow Condensed", "Impact", "Arial Narrow Bold", sans-serif';
export const RADIO_READ_FONT = '"Inter", "Arial", sans-serif';

export const RadioDoBoxFonts = () => (
  <style>
    {`
      @font-face {
        font-family: "Barlow Condensed";
        src: url("${staticFile('fonts/radio-do-box/BarlowCondensed-Black.ttf')}") format("truetype");
        font-weight: 900;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: "Barlow Condensed";
        src: url("${staticFile('fonts/radio-do-box/BarlowCondensed-ExtraBold.ttf')}") format("truetype");
        font-weight: 800;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: "Barlow Condensed";
        src: url("${staticFile('fonts/radio-do-box/BarlowCondensed-Bold.ttf')}") format("truetype");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: "Inter";
        src: url("${staticFile('fonts/radio-do-box/Inter_18pt-Bold.ttf')}") format("truetype");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: "Inter";
        src: url("${staticFile('fonts/radio-do-box/Inter_18pt-SemiBold.ttf')}") format("truetype");
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: "Inter";
        src: url("${staticFile('fonts/radio-do-box/Inter_18pt-Medium.ttf')}") format("truetype");
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
    `}
  </style>
);
