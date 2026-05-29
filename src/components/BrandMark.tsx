import {Img, staticFile} from 'remotion';

type BrandMarkProps = {
  brandName: string;
  brandLogoPath?: string;
};

export const BrandMark = ({brandName, brandLogoPath}: BrandMarkProps) => {
  const [top, bottom] = brandName.split(' ');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        paddingLeft: 4,
        color: '#ffffff',
      }}
    >
      {brandLogoPath ? (
        <Img
          src={staticFile(brandLogoPath.replace(/^\//, ''))}
          style={{
            width: 248,
            height: 96,
            objectFit: 'contain',
            objectPosition: 'left center',
            filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.4))',
          }}
        />
      ) : (
        <>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '4px solid #ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            ⚽
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 44,
              lineHeight: 0.88,
              fontWeight: 900,
              letterSpacing: -1,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            <span>{top}</span>
            <span>{bottom ?? ''}</span>
          </div>
        </>
      )}
    </div>
  );
};
