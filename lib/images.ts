import { FC, SVGProps } from 'react';
import AccountBalanceIcon from 'components/svg/tags/AccountBalanceIcon';
import BitcoinIcon from 'components/svg/tags/BitcoinIcon';
import ExchangeIcon from 'components/svg/tags/ExchangeIcon';
import AccountCircleIcon from 'components/svg/tags/AccountCircleIcon';
import AlternateEmailIcon from 'components/svg/tags/AlternateEmailIcon';
import BackupIcon from 'components/svg/tags/BackupIcon';
import BuildIcon from 'components/svg/tags/BuildIcon';
import CloudIcon from 'components/svg/tags/CloudIcon';
import CreditCardIcon from 'components/svg/tags/CreditCardIcon';
import ErrorIcon from 'components/svg/tags/ErrorIcon';
import FavoriteIcon from 'components/svg/tags/FavoriteIcon';
import GradeIcon from 'components/svg/tags/GradeIcon';
import GroupIcon from 'components/svg/tags/GroupIcon';
import ImagesModeIcon from 'components/svg/tags/ImagesModeIcon';
import LabelImportantIcon from 'components/svg/tags/LabelImportantIcon';
import LanguageIcon from 'components/svg/tags/LanguageIcon';
import MonitoringIcon from 'components/svg/tags/monitoringIcon';
import NotificationImportantIcon from 'components/svg/tags/NotificationImportantIcon';
import ShoppingBagIcon from 'components/svg/tags/ShoppingBagIcon';
import ShoppingBasketIcon from 'components/svg/tags/ShoppingBasketIcon';
import ShoppingCartIcon from 'components/svg/tags/ShoppingCartIcon';
import TravelExploreIcon from 'components/svg/tags/TravelExploreIcon';
import WifiIcon from 'components/svg/tags/WifiIcon';

export const TAG_ALL = 'ALL';
export const TAG_SOCIAL = 'group';
export const TAG_BITCOIN = 'bitcoin';
export const SELECTABLE_TAG_ICONS: Map<string, FC<SVGProps<SVGSVGElement>>> = new Map([
  [TAG_BITCOIN, BitcoinIcon],
  ['exchange', ExchangeIcon],
  ['account_balance', AccountBalanceIcon],
  ['account_circle', AccountCircleIcon],
  ['alternate_email', AlternateEmailIcon],
  ['backup', BackupIcon],
  ['build', BuildIcon],
  ['cloud', CloudIcon],
  ['credit_card', CreditCardIcon],
  ['error', ErrorIcon],
  ['favorite', FavoriteIcon],
  ['grade', GradeIcon],
  [TAG_SOCIAL, GroupIcon],
  ['images_mode', ImagesModeIcon],
  ['label_important', LabelImportantIcon],
  ['language', LanguageIcon],
  ['monitoring', MonitoringIcon],
  ['notification_important', NotificationImportantIcon],
  ['shopping_bag', ShoppingBagIcon],
  ['shopping_basket', ShoppingBasketIcon],
  ['shopping_cart', ShoppingCartIcon],
  ['travel_explore', TravelExploreIcon],
  ['wifi', WifiIcon],
]);

const enum IMG_PATH {
  DROPBOX = '/images/logos/dropbox/',
  UI = '/images/ui/',
  BACKGROUND = '/images/background/',
  TREZOR = '/images/logos/trezor/',
  APP = '/images/logos/',
}

export class IMAGE_FILE {
  static TRANSPARENT_PNG = new IMAGE_FILE('transparent.png', IMG_PATH.UI);
  static DROPBOX = new IMAGE_FILE('dropbox.svg', IMG_PATH.DROPBOX);
  static DROPBOX_BLUE = new IMAGE_FILE('dropbox-blue.svg', IMG_PATH.DROPBOX);
  static DROPBOX_GREY = new IMAGE_FILE('dropbox-grey.svg', IMG_PATH.DROPBOX);
  static CONNECT_TREZOR = new IMAGE_FILE('connect-trezor.svg', IMG_PATH.TREZOR);
  static TREZOR_1 = new IMAGE_FILE('t1.png', IMG_PATH.TREZOR);
  static TREZOR_2 = new IMAGE_FILE('t2.png', IMG_PATH.TREZOR);
  static TREZOR_BUTTON = new IMAGE_FILE('trezor_button.png', IMG_PATH.TREZOR);
  static TPM_LOGO = new IMAGE_FILE('tpm-logo.svg', IMG_PATH.APP);
  static BACKGROUND = new IMAGE_FILE('tmp_background.png', IMG_PATH.BACKGROUND);
  constructor(
    private readonly file: string,
    private readonly basePath: IMG_PATH
  ) {
    this.file = file;
    this.basePath = basePath;
  }
  public path(): string {
    return `${this.basePath}${this.file}`;
  }
}
