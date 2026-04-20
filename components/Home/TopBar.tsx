import { View } from "react-native";
import Address from "./Address";
import CartIcon from "./CartIcon";
import NotificationIcon from "./NotificationsIcon";

export default function TopBar(){
    return(
        <View className="flex-row items-start justify-between pb-2 px-4 pt-2">
            <View className="flex-1 mr-4">
                <Address/>
            </View>
            <View className="flex-row items-center gap-4 mt-2">
                <NotificationIcon/>
                <CartIcon/>
            </View>
        </View>
    );
}