import DailyNorm from "@/components/blocks/DailyNorms/DailyNorm";
import Layout from "@/components/common/Layout/Layout";
import Container from "@/components/ui/Container/Container";
import EditableText from "@/components/ui/EditableText/EditableText";
import RemoveButton from "@/components/ui/RemoveButton/RemoveButton";
import { Tab } from "@/components/ui/Tab";
import { TabList } from "@/components/ui/TabList";
import { rootDailyNormStore } from "@/store/rootStore";
import { observer } from "mobx-react-lite";
import React from "react";

const DailyNorms = () => {

  const {
    currentStore,
    stores,
    currentId,
    setCurrentId,
    isDraftId,
    remove,
    setCurrentDailyNormInUseId,
    dailyNormIdCurrentlyInUse,
    fetchManager,
  } = rootDailyNormStore;

  const { loading } = fetchManager;
  const name = currentStore?.name || ''

  console.log(stores.length);

  return (
    <Layout
      left={
        <TabList isLoading={loading.all}>
          {stores.map(({ id, name }, i) => (
            <Tab
              before={
                <input
                  type="radio"
                  checked={id === dailyNormIdCurrentlyInUse}
                  onChange={() => setCurrentDailyNormInUseId(id)}
                />
              }
              key={id}
              draft={i === 0}
              onClick={() => setCurrentId(id)}
              isActive={currentId === id}
              after={
                isDraftId(id) ? null : (
                  <RemoveButton onClick={() => remove(id)} />
                )
              }
            >
              {name}
            </Tab>
          ))}
        </TabList>
      }
      center={
        currentStore && <DailyNorm store={currentStore}></DailyNorm>
      }
      title={
        currentStore &&
        <EditableText value={name} typographyProps={{ variant: "h1" }}
          onChange={currentStore.setName}
        />
      }
      right={
        null
      }
    >
    </Layout>
  )

  // return (

  //   <Container>
  //     <Container>
  //       <TabList isLoading={loading.all}>
  //         {stores.map(({ id, name }, i) => (
  //           <Tab
  //             before={
  //               <input
  //                 type="radio"
  //                 checked={id === dailyNormIdCurrentlyInUse}
  //                 onChange={() => setCurrentDailyNormInUseId(id)}
  //               />
  //             }
  //             key={id}
  //             draft={i === 0}
  //             onClick={() => setCurrentId(id)}
  //             isActive={currentId === id}
  //             after={
  //               isDraftId(id) ? null : (
  //                 <RemoveButton onClick={() => remove(id)} />
  //               )
  //             }
  //           >
  //             {name}
  //           </Tab>
  //         ))}
  //       </TabList>
  //     </Container>
  //     <Container boxShadow>
  //       {currentStore && <DailyNorm store={currentStore}></DailyNorm>}
  //     </Container>
  //   </Container>

};

export default observer(DailyNorms);
