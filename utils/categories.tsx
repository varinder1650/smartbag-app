import api from "./client";

const fetchCategories = async () => {
    const response = await api.get("/categories/")
    return response.data;
}
export default fetchCategories;