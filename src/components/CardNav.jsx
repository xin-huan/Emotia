import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';

const DESKTOP_HEIGHT = 260;
const COLLAPSED_HEIGHT = 60;

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  title,
  items,
  className = '',
  ease = 'expo.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  renderLink,
  startExpanded = false,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(startExpanded);
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateMobileHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return DESKTOP_HEIGHT;
    const contentEl = navEl.querySelector('.card-nav-content');
    if (!contentEl) return DESKTOP_HEIGHT;

    const prev = {
      visibility: contentEl.style.visibility,
      pointerEvents: contentEl.style.pointerEvents,
      position: contentEl.style.position,
      height: contentEl.style.height,
    };

    contentEl.style.visibility = 'visible';
    contentEl.style.pointerEvents = 'auto';
    contentEl.style.position = 'static';
    contentEl.style.height = 'auto';
    // force reflow
    contentEl.offsetHeight;

    const h = COLLAPSED_HEIGHT + contentEl.scrollHeight + 16;

    Object.assign(contentEl.style, prev);
    return h;
  };

  const getTargetHeight = () => {
    if (typeof window === 'undefined') return DESKTOP_HEIGHT;
    return window.matchMedia('(max-width: 768px)').matches
      ? calculateMobileHeight()
      : DESKTOP_HEIGHT;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    const targetHeight = getTargetHeight();
    const initHeight = startExpanded ? targetHeight : COLLAPSED_HEIGHT;

    gsap.set(navEl, { height: initHeight, overflow: 'hidden' });
    gsap.set(cardsRef.current, {
      y: startExpanded ? 0 : 24,
      opacity: startExpanded ? 1 : 0,
    });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: targetHeight,
      duration: 0.3,
      ease,
    }, 0);

    tl.to(cardsRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.28,
      ease: 'back.out(1.2)',
      stagger: 0.04,
    }, '-=0.06');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    if (startExpanded) tl?.progress(1);
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current || !navRef.current) return;
      tlRef.current.kill();

      const newTarget = getTargetHeight();
      const newTl = gsap.timeline({ paused: true });

      if (isExpanded) {
        gsap.set(navRef.current, { height: newTarget });
        gsap.set(cardsRef.current, { y: 0, opacity: 1 });
        newTl.to(navRef.current, { height: newTarget, duration: 0.3, ease })
              .to(cardsRef.current, { y: 0, opacity: 1, duration: 0.28, ease: 'back.out(1.2)', stagger: 0.04 }, '-=0.06');
        newTl.progress(1);
      } else {
        gsap.set(navRef.current, { height: COLLAPSED_HEIGHT });
        gsap.set(cardsRef.current, { y: 24, opacity: 0 });
        newTl.to(navRef.current, { height: newTarget, duration: 0.3, ease })
              .to(cardsRef.current, { y: 0, opacity: 1, duration: 0.28, ease: 'back.out(1.2)', stagger: 0.04 }, '-=0.06');
      }

      tlRef.current = newTl;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div
      className={`card-nav-container relative w-full z-[1] ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''} block p-0 rounded-xl shadow-md relative overflow-hidden`}
        style={{ backgroundColor: baseColor, height: COLLAPSED_HEIGHT }}
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-transform duration-200 ease-out ${
                isHamburgerOpen ? 'translate-y-[8px] rotate-45' : ''
              } group-hover:opacity-75`}
            />
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-transform duration-200 ease-out ${
                isHamburgerOpen ? '-translate-y-[0px] -rotate-45' : ''
              } group-hover:opacity-75`}
            />
          </div>

          <div className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            {title ? (
              <span className="text-lg font-bold tracking-wide" style={{ color: menuColor || '#000' }}>{title}</span>
            ) : (
              <img src={logo} alt={logoAlt} className="logo h-[28px]" />
            )}
          </div>

          {buttonBgColor && buttonTextColor && (
            <button
              type="button"
              className="card-nav-cta-button hidden md:inline-flex border-0 rounded-[calc(0.75rem-0.2rem)] px-4 items-center h-full font-medium cursor-pointer transition-colors duration-300"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              Get Started
            </button>
          )}
        </div>

        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          } md:flex-row md:items-stretch md:gap-[16px]`}
          aria-hidden={!isExpanded}
        >
          {(items || []).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2 p-[12px_16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%]"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label font-normal tracking-[-0.5px] text-[18px] md:text-[22px]">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                {renderLink
                  ? item.links?.map((lnk, i) => renderLink(lnk, i))
                  : item.links?.map((lnk, i) => (
                      <a
                        key={`${lnk.label}-${i}`}
                        className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]"
                        href={lnk.href}
                        aria-label={lnk.ariaLabel}
                      >
                        <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                        {lnk.label}
                      </a>
                    ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
