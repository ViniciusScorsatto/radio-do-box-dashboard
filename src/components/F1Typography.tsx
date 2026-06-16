export const F1_DISPLAY_FONT = '"Barlow Condensed", "Impact", "Arial Narrow Bold", sans-serif';
export const F1_DATA_FONT = '"Inter", "Avenir Next", "Segoe UI", sans-serif';

export const F1FontFaces = () => (
  <style>
    {`
      @font-face {
        font-family: "Barlow Condensed";
        src: url("/fonts/radio-do-box/BarlowCondensed-Black.ttf") format("truetype");
        font-weight: 900;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Barlow Condensed";
        src: url("/fonts/radio-do-box/BarlowCondensed-ExtraBold.ttf") format("truetype");
        font-weight: 800;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Barlow Condensed";
        src: url("/fonts/radio-do-box/BarlowCondensed-Bold.ttf") format("truetype");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Inter";
        src: url("/fonts/radio-do-box/Inter-Bold.ttf") format("truetype");
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Inter";
        src: url("/fonts/radio-do-box/Inter-SemiBold.ttf") format("truetype");
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "Inter";
        src: url("/fonts/radio-do-box/Inter-Medium.ttf") format("truetype");
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
    `}
  </style>
);
