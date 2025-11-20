export interface OrderInfo {
  orderID: number;
  loginName: string;
  orderDate: string;
  totalPrice: number;
  providerName: 'VCB' | 'OCB' | 'MoMo' | 'ZaloPay';
  accountID: string;
  addressID: number;
}
