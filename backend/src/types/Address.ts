export interface Address {
  loginName: string;
  addressID: number;
  contactName: string;
  contactPhoneNumber: string;
  city: string;
  district: string;
  commune: string;
  detailAddress: string;
  addressType: 'Home' | 'Office';
  isAddressDefault: boolean;
}
