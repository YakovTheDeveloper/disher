import AddDishToDay from '@/components/blocks/Days/AddDishToDay/AddDishToDay'
import Day from '@/components/blocks/Days/Day'
import NutrientPercent from '@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent'
import NutrientsTotal from '@/components/blocks/NutrientsTotal/NutrientsTotal'
import NutrientValue from '@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue'
import Layout from '@/components/common/Layout/Layout'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { rootDayStore2 } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'

const Days = () => {
    const {
        currentStore,
        allStores,
        calculations,
        setCurrentDayId,
        currentDayId,
        isDraftId,
        removeDay
    } = rootDayStore2

    return (
        <Layout
            left={
                <TabList >
                    {allStores.map(({ id, name }, i) => (
                        <Tab
                            key={id}
                            draft={i === 0}
                            onClick={() => setCurrentDayId(id)}
                            isActive={currentDayId === id}
                            after={isDraftId(id) ? null : <RemoveButton onClick={() => removeDay(id)} size='small' />}
                        >

                            {name}
                        </Tab>))}
                </TabList>
            }
            center={
                currentStore && (
                    <Day store={currentStore} >
                        {currentStore.currentCategory &&
                            <AddDishToDay currentCategory={currentStore.currentCategory}
                            />}
                    </Day>
                )

            }
            right={
                currentStore &&
                <NutrientsTotal
                    rowPositionSecond={(nutrient) => (
                        <NutrientValue
                            nutrient={nutrient}
                            calculations={calculations}

                        />
                    )}
                    rowPositionThird={({ id }) => (
                        <NutrientPercent
                            nutrientId={id}
                            nutrientQuantity={calculations.totalNutrients[id]}
                        />
                    )}
                    loading={false}>
                </NutrientsTotal>
            }
        >
        </Layout>
    )
}

export default observer(Days)

