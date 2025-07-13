export interface Item {
  item_id: number;
  item_name: string;
  is_checked: boolean;
  quantity: number;
}
export interface Trip {
  location_name: string;
}
export interface Props {
  trip_id: number;
  initialTrip: Trip;
  initialItems: Item[];
}
