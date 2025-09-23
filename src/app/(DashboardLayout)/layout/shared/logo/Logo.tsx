'use client'
import config from '@/app/context/config';
import { CustomizerContext } from "@/app/context/customizerContext";
import { createAssetUrl } from '@/utils/basePath';
import { styled } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";

const Logo = () => {
  const { isCollapse, isSidebarHover, activeDir, activeMode } = useContext(CustomizerContext);

  const TopbarHeight = config.topbarHeight;

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,

    width: isCollapse == "mini-sidebar" && !isSidebarHover ? '40px' : '180px',
    overflow: "hidden",
    display: "block",
  }));

  if (activeDir === "ltr") {
    return (
      <LinkStyled href="/">
        {activeMode === "dark" ? (
          <Image
            src={createAssetUrl("/images/logos/logo_juragan_beku.png")}
            alt="logo"
            height={TopbarHeight}
            width={180}
            priority
          />
        ) : (
          <Image
            src={createAssetUrl("/images/logos/logo_juragan_beku.png")}
            alt="logo"
            height={TopbarHeight}
            width={180}
            priority
          />
        )}
      </LinkStyled>
    );
  }

  return (
    <LinkStyled href="/">
      {activeMode === "dark" ? (
        <Image
          src={createAssetUrl("/images/logos/dark-rtl-logo.svg")}
          alt="logo"
          height={TopbarHeight}
          width={174}
          priority
        />
      ) : (
        <Image
          src={createAssetUrl("/images/logos/light-logo-rtl.svg")}
          alt="logo"
          height={TopbarHeight}
          width={174}
          priority
        />
      )}
    </LinkStyled>
  );
};

export default Logo;
