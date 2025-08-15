export interface Item {
  item_id: number;
  item_name: string;
  is_checked: boolean;
  quantity: number;
}
export interface Trip {
  trip_id?: number;
  location_name: string;
  group_id?: number | null;
  trip_type?: "personal" | "group" | null;
}
export interface Props {
  trip_id: number;
  initialTrip: Trip;
  initialLinkedTrip?: Trip | null;
  initialItems: Item[];
  hideCompletedDefault: boolean;
}
