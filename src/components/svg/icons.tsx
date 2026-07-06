import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Social Icons
// @ts-ignore
import FacebookSvg from '@/assets/icons/social/facebook.svg';
// @ts-ignore
import TwitterSvg from '@/assets/icons/social/twitter.svg';
// @ts-ignore
import InstagramSvg from '@/assets/icons/social/instagram.svg';
// @ts-ignore
import LinkedInSvg from '@/assets/icons/social/linkedin.svg';
// @ts-ignore
import YouTubeSvg from '@/assets/icons/social/youtube.svg';
// @ts-ignore
import GitHubSvg from '@/assets/icons/social/github.svg';
// @ts-ignore
import DiscordSvg from '@/assets/icons/social/discord.svg';
// @ts-ignore
import GoogleSvg from '@/assets/icons/social/google.svg';

// Finance Icons
// @ts-ignore
import WalletSvg from '@/assets/icons/finance/wallet.svg';
// @ts-ignore
import IncomeSvg from '@/assets/icons/finance/income.svg';
// @ts-ignore
import ExpenseSvg from '@/assets/icons/finance/expense.svg';
// @ts-ignore
import BudgetSvg from '@/assets/icons/finance/budget.svg';
// @ts-ignore
import SavingSvg from '@/assets/icons/finance/saving.svg';
// @ts-ignore
import InvestmentSvg from '@/assets/icons/finance/investment.svg';

// Navigation Icons
// @ts-ignore
import HomeSvg from '@/assets/icons/navigation/home.svg';
// @ts-ignore
import BackSvg from '@/assets/icons/navigation/back.svg';
// @ts-ignore
import MenuSvg from '@/assets/icons/navigation/menu.svg';
// @ts-ignore
import CloseSvg from '@/assets/icons/navigation/close.svg';
// @ts-ignore
import ArrowRightSvg from '@/assets/icons/navigation/arrow-right.svg';

// Action Icons
// @ts-ignore 
import SearchSvg from '@/assets/icons/action/search.svg';
// @ts-ignore 
import SettingsSvg from '@/assets/icons/action/settings.svg';
// @ts-ignore 
import ShareSvg from '@/assets/icons/action/share.svg';
// @ts-ignore 
import HeartSvg from '@/assets/icons/action/heart.svg';
// @ts-ignore 
import CheckSvg from '@/assets/icons/action/check.svg';

// Auth Icons
// @ts-ignore
import FingerprintSvg from '@/assets/icons/auth/fingerprint.svg';
// @ts-ignore
import MailSvg from '@/assets/icons/auth/mail.svg';
// @ts-ignore
import PhoneSvg from '@/assets/icons/auth/phone.svg';
// @ts-ignore
import UserSvg from '@/assets/icons/auth/user.svg';

// Base Icon Props
export interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
  className?: string;
}

// Base Icon Component
const BaseIcon: React.FC<{ xml: string; size: number; color?: string; style?: ViewStyle }> = ({
  xml,
  size,
  color,
  style,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <SvgXml xml={xml} width={size} height={size} color={color} />
    </View>
  );
};

// Social Icons
export const FacebookIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={FacebookSvg} size={size} color={color} style={style} />
);

export const TwitterIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={TwitterSvg} size={size} color={color} style={style} />
);

export const InstagramIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={InstagramSvg} size={size} color={color} style={style} />
);

export const LinkedInIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={LinkedInSvg} size={size} color={color} style={style} />
);

export const YouTubeIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={YouTubeSvg} size={size} color={color} style={style} />
);

export const GitHubIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={GitHubSvg} size={size} color={color} style={style} />
);

export const DiscordIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={DiscordSvg} size={size} color={color} style={style} />
);

export const GoogleIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={GoogleSvg} size={size} color={color} style={style} />
);

// Finance Icons
export const WalletIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={WalletSvg} size={size} color={color} style={style} />
);

export const IncomeIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={IncomeSvg} size={size} color={color} style={style} />
);

export const ExpenseIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={ExpenseSvg} size={size} color={color} style={style} />
);

export const BudgetIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={BudgetSvg} size={size} color={color} style={style} />
);

export const SavingIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={SavingSvg} size={size} color={color} style={style} />
);

export const InvestmentIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={InvestmentSvg} size={size} color={color} style={style} />
);

// Navigation Icons
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={HomeSvg} size={size} color={color} style={style} />
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={BackSvg} size={size} color={color} style={style} />
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={MenuSvg} size={size} color={color} style={style} />
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={CloseSvg} size={size} color={color} style={style} />
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={ArrowRightSvg} size={size} color={color} style={style} />
);

// Action Icons
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={SearchSvg} size={size} color={color} style={style} />
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={SettingsSvg} size={size} color={color} style={style} />
);

export const ShareIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={ShareSvg} size={size} color={color} style={style} />
);

export const HeartIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={HeartSvg} size={size} color={color} style={style} />
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={CheckSvg} size={size} color={color} style={style} />
);

// Auth Icons
export const FingerprintIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={FingerprintSvg} size={size} color={color} style={style} />
);

export const MailIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={MailSvg} size={size} color={color} style={style} />
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={PhoneSvg} size={size} color={color} style={style} />
);

export const UserIcon: React.FC<IconProps> = ({ size = 24, color, style }) => (
  <BaseIcon xml={UserSvg} size={size} color={color} style={style} />
);

// Default export avec tous les icônes
const Icons = {
  // Social
  Facebook: FacebookIcon,
  Twitter: TwitterIcon,
  Instagram: InstagramIcon,
  LinkedIn: LinkedInIcon,
  YouTube: YouTubeIcon,
  GitHub: GitHubIcon,
  Discord: DiscordIcon,
  Google: GoogleIcon,
  // Finance
  Wallet: WalletIcon,
  Income: IncomeIcon,
  Expense: ExpenseIcon,
  Budget: BudgetIcon,
  Saving: SavingIcon,
  Investment: InvestmentIcon,
  // Navigation
  Home: HomeIcon,
  Back: BackIcon,
  Menu: MenuIcon,
  Close: CloseIcon,
  ArrowRight: ArrowRightIcon,
  // Action
  Search: SearchIcon,
  Settings: SettingsIcon,
  Share: ShareIcon,
  Heart: HeartIcon,
  Check: CheckIcon,
  // Auth
  Fingerprint: FingerprintIcon,
  Mail: MailIcon,
  Phone: PhoneIcon,
  User: UserIcon,
};

export default Icons;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});