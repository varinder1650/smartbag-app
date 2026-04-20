import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";

type SearchString = {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
};

const SEARCH_TERMS = [
    '"greeting cards"',
    '"milk, curd & paneer"',
    '"vegetables"',
    '"pooja needs"',
    '"cold drinks"',
    '"snacks"',
];

export default function SearchBar({
    searchQuery,
    setSearchQuery,
}: SearchString) {
    const [placeholderText, setPlaceholderText] = useState("");
    const [termIndex, setTermIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const currentTerm = SEARCH_TERMS[termIndex];

        if (isDeleting) {
            if (placeholderText === "") {
                setIsDeleting(false);
                setTermIndex((prev) => (prev + 1) % SEARCH_TERMS.length);
                timer = setTimeout(() => { }, 200); // tiny pause before typing next
            } else {
                timer = setTimeout(() => {
                    setPlaceholderText(currentTerm.substring(0, placeholderText.length - 1));
                }, 40); // fast deletion speed
            }
        } else {
            if (placeholderText === currentTerm) {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, 2000); // pause when full word is typed
            } else {
                timer = setTimeout(() => {
                    setPlaceholderText(currentTerm.substring(0, placeholderText.length + 1));
                }, 80); // typing speed
            }
        }

        return () => clearTimeout(timer);
    }, [placeholderText, isDeleting, termIndex]);

    return (
        <View className="flex-row items-center px-4 pb-2">
            <View className="flex-row flex-1 items-center px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
                <Ionicons name="search-outline" size={20} color="#9CA3AF" />

                <TextInput
                    placeholder={`Search ${placeholderText}`}
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="ml-2 flex-1 text-gray-900"
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>
        </View>
    );
}