import Actions from "@/components/blocks/common/Actions/Actions";
import DraftActions2 from "@/components/blocks/common/Actions/DraftActions2";
import UserActions2 from "@/components/blocks/common/Actions/UserActions2";
import DailyNorm from "@/components/blocks/DailyNorms/DailyNorm";
import DailyNormTabs from "@/components/blocks/DailyNorms/DailyNormTabs";
import DefaultDailyNorm from "@/components/blocks/DailyNorms/DefaultDailyNorm/DefaultDailyNorm";
import Layout from "@/components/common/Layout/Layout";
import SelectableInput from "@/components/ui/Button/SelectableInput/SelectableInput";

import Container from "@/components/ui/Container/Container";
import EditableText from "@/components/ui/EditableText/EditableText";
import RemoveButton from "@/components/ui/RemoveButton/RemoveButton";
import { Tab } from "@/components/ui/Tab";
import { TabList } from "@/components/ui/TabList";
import { DailyNormStore, DefaultNormStore, DraftNormStore, UserNormStore } from "@/store/dailyNormStore/dailyNormStore";
import { Flows, rootDailyNormStore } from "@/store/rootStore";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

const DailyNorms = () => {

  const {
    currentStore,
    draftStore,
    loadingState,
  } = rootDailyNormStore;

  useEffect(() => {
    Flows.Norm.getAll()
  }, [])

  if (!currentStore) return

  return (
    <Layout
      left={<DailyNormTabs
        store={rootDailyNormStore}
        onRemove={() => Flows.Norm.remove(currentStore.id, currentStore.name)}
      />}
      center={
        currentStore instanceof DefaultNormStore
          ? <DefaultDailyNorm store={currentStore} />
          : (
            <DailyNorm store={currentStore}>
              {currentStore instanceof UserNormStore
                ? <UserActions2
                  store={currentStore}
                  loadingState={loadingState}
                  remove={() => Flows.Norm.remove(currentStore.id, currentStore.name)}
                  update={() => Flows.Norm.update(currentStore.id, currentStore.name)}
                  resetToInit={currentStore.resetToInit}
                />
                : <DraftActions2
                  loadingState={loadingState}
                  isEmpty={draftStore.empty}
                  resetToInit={draftStore.resetToInit}
                  save={Flows.Norm.create}
                />
              }
            </DailyNorm>
          )

      }
      right={
        null
      }
      overlayCenter={
        (currentStore instanceof DraftNormStore && loadingState.getLoading('save'))
        || loadingState.getLoading('update', currentStore?.id || -1)
        || loadingState.getLoading('delete', currentStore?.id || -1)
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
