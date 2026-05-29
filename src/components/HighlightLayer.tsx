type HighlightLayerProps = {
  rows: number;
};

const HEADER_HEIGHT = 118;

export const HighlightLayer = ({rows}: HighlightLayerProps) => {
  const tableBodyHeight = 1920 - 96 - 72 - 210 - 188 - 72;
  const rowHeight = tableBodyHeight / rows;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          top: HEADER_HEIGHT,
          height: rowHeight * 3,
          borderRadius: 28,
          background:
            'linear-gradient(180deg, rgba(104, 223, 118, 0.26), rgba(52, 155, 73, 0.18))',
          boxShadow: 'inset 0 0 0 1px rgba(152, 255, 143, 0.16)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          height: rowHeight * 3,
          borderRadius: 28,
          background:
            'linear-gradient(180deg, rgba(255, 111, 111, 0.16), rgba(172, 34, 34, 0.24))',
          boxShadow: 'inset 0 0 0 1px rgba(255, 157, 157, 0.14)',
        }}
      />
    </div>
  );
};
