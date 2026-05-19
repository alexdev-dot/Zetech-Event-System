import React from 'react';
import { 
  FaFacebook, 
  FaInstagram, 
  FaLinkedin, 
  FaYoutube, 
  FaTiktok 
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';


interface SocialMediaIcon {
  href: string;
  ariaLabel: string;
  icon: React.ReactNode;
}

const SocialMediaIcons: React.FC = () => {
  const socialMediaLinks: SocialMediaIcon[] = [
    {
      href: "https://www.facebook.com/ZetechUniv",
      ariaLabel: "Zetech University Facebook",
      icon: <FaFacebook className="w-3 h-3" />
    },
    {
      href: "https://x.com/ZetechUni",
      ariaLabel: "Zetech University X",
      icon: <FaXTwitter className="w-3 h-3" />
    },
    {
      href: "https://www.instagram.com/zetech_university/",
      ariaLabel: "Zetech University Instagram",
      icon: <FaInstagram className="w-3 h-3" />
    },
    {
      href: "https://www.linkedin.com/school/zetech-university-kenya/posts/?feedView=all",
      ariaLabel: "Zetech University LinkedIn",
      icon: <FaLinkedin className="w-3 h-3" />
    },
    {
      href: "https://www.youtube.com/@ZetechUni",
      ariaLabel: "Zetech University YouTube",
      icon: <FaYoutube className="w-3 h-3" />
    },
    {
      href: "https://www.tiktok.com/@zetechuniversity",
      ariaLabel: "Zetech University TikTok",
      icon: <FaTiktok className="w-3 h-3" />
    }
  ];

  return (
    <div className="flex items-center gap-2">
      {socialMediaLinks.map((social, index) => (
        <a
          key={index}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.ariaLabel}
          className="hover:opacity-80 transition-opacity"
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
};

export default SocialMediaIcons;
