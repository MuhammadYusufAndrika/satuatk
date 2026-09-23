import ItemForm from './Form';

export default function Edit({ item, categories, units, suppliers }) {
    return <ItemForm item={item} categories={categories} units={units} suppliers={suppliers} isEdit />;
}
