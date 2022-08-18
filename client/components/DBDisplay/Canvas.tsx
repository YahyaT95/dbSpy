// React & React Router & React Query Modules;
import React from "react";
import { useMutation } from "react-query";

//Components imported;
import Table from "./Table";

// UI & Visualization Libraries
import axios from "axios";
import DataStore from "../../Store";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import Draggable from "react-draggable";
import { DatabaseImport, DatabaseOff } from "tabler-icons-react";
import { Loader, Text, Button, Group } from "@mantine/core";

interface CanvasProps {
  fetchedData: {
    [key: string]: {
      [key: string]: {
        IsForeignKey: boolean;
        IsPrimaryKey: boolean;
        Name: string;
        References: any[];
        TableName: string;
        Value: any;
        additional_constraints: string | null;
        data_type: string;
        field_name: string;
      };
    };
  };
  isLoadingProps: boolean;
  isErrorProps: boolean;
  setFetchedData: (fetchedData: object) => void;
  setSideBarOpened: (param: boolean) => void;
  reference: any;
}

/** Canvas Component - a canvas section where Tables being generated */
export default function Canvas({
  isLoadingProps,
  isErrorProps,
  fetchedData,
  setFetchedData,
  reference,
}: CanvasProps) {
  /** useMutation for handling 'POST' request to '/api/handleQueries' route for executing series of queries for DB migration; 
  onSuccess: Once queries get complete, it will clear out the sessionStorage and render the latestTableModel confirming the success of migration
  */
  const { isLoading, isError, mutate } = useMutation(
    (dbQuery: object) => {
      return axios.post("/api/handleQueries", dbQuery).then((res) => {});
    },
    {
      onSuccess: () => {
        //Upon success of query execution, we will store the latest Table Model from DataStore into a variable named "lastestTableModel".
        const latestTableModel: any = DataStore.getData(
          DataStore.store.size - 1
        );
        //Then, we clear DataStore (global state that gets reset after refresh) and set the initial Table Model with latestTableModel and emtpy query.
        DataStore.clearStore();
        DataStore.setQuery([{ type: "", query: "" }]);
        DataStore.setData(latestTableModel);

        //Update sessionStorage Data and Query with recently updated DataStore.
        sessionStorage.Data = JSON.stringify(
          Array.from(DataStore.store.entries())
        );
        sessionStorage.Query = JSON.stringify(
          Array.from(DataStore.queries.entries())
        );

        //Update the rendering of the tables with latest table model.
        setFetchedData(latestTableModel);
      },
      onError: () => {
        //Upon error, alert the user with error message
        alert("Failed to execute changes");
      },
    }
  );

  /** "executeChanges" - a function that gets invoked when Execute button is clicked and trigger useMutation for POST request;
   *  Grabs the URI data and queries from global state "DataStore" and pass it into mutate method;
   */
  const executeChanges = () => {
    const obj = JSON.parse(JSON.stringify(DataStore.userDBInfo));

    // creating URI for server to connect to user's db
    let db_uri =
      "postgres://" +
      obj.username +
      ":" +
      obj.password +
      "@" +
      obj.hostname +
      ":" +
      obj.port +
      "/" +
      obj.database_name;

    // uri examples
    // DATABASE_URL=postgres://{user}:{password}@{hostname}:{port}/{database-name}
    // "postgres://YourUserName:YourPassword@YourHostname:5432/YourDatabaseName";
    const dbQuery = {
      queries: DataStore.getQuery(DataStore.queries.size - 1),
      uri: db_uri,
    };
    mutate(dbQuery);
  };

  /** "tables" is an array with Table components generated by iterating fetchedData */
  const tables: JSX.Element[] = Object.keys(fetchedData).map(
    (tablename: any, ind: number) => {
      return (
        <Table
          key={`Table${ind}`}
          id={tablename}
          tableInfo={fetchedData[tablename]}
          setFetchedData={setFetchedData}
          fetchedData={fetchedData}
        />
      );
    }
  );

  /** "refArray" is an array of Reference object where IsDestination is true */
  let refArray: string[] = [];
  for (let table in fetchedData) {
    for (let column in fetchedData[table]) {
      for (let ref in fetchedData[table][column].References) {
       // console.log('ref in fetchedData...table Colum.References');
       // console.log(fetchedData[table][column].References)
        if (fetchedData[table][column].References[ref].IsDestination == false)
          refArray.push(fetchedData[table][column].References[ref]);
      }
    }
  }

  /** "xa" is an array with Xarrow components generated by iterating through refArray
   * and assign start of the arrow to PrimaryKeyTableName & end of the arrow to ReferencesTableName*/
  const xa: JSX.Element[] = refArray.map((reff: any, ind:number) => {
    // console.log('in Xarrows PrimaryKeyTableName---------->')
    // console.log(reff.PrimaryKeyTableName)
    // console.log('in Xarrows FK Table Name')
    // console.log(reff.ReferencesTableName)
    // console.log('<------------------')
    return (
      <Xarrow
        key={ind}
        headSize={5}
        zIndex={-1}
        color={"grey"}
        start={reff.ReferencesTableName}
        end={reff.PrimaryKeyTableName}
        endAnchor={[
          { position: "right", offset: { x: +10, y: +10 } },
          { position: "left", offset: { x: -10, y: -10 } },
          { position: "bottom", offset: { x: +10, y: +10 } },
          { position: "top", offset: { x: -10 } },
        ]}
        curveness={1.0}
        animateDrawing={2}
      />
    );
  });

  // const mouseOverTable = () => {
  //   //see what the table array looks like
  //   console.log('THIS IS TABLES', tables);
  //   // loop over the tables array to access each table
  //   for (let i = 0; i < tables.length; i += 1) {
  //     //grab that tables id
  //     const eachTableId = tables[i].props.id;
  //     console.log('THIS IS THE TABLE ID FROM INSIDE LOOP', tables[0].props.id)
  //     //grab the ids of the document
  //     const documentId = document.getElementById(`${eachTableId}`);
  //     //if the documentId matches the tableId
  //     if (documentId === eachTableId) {
  //       //render the xarrows
  //       return {xarrows}
  //     }
  //   }
  // }

  // mouseOverTable();

  //  function mouseOverTable1() {
  //   console.log('THIS IS TABLES', tables)

  // }

  // mouseOverTable1();

  const xarrows: JSX.Element[] = refArray.map((reff: any, ind: number) => {
    return (
      <Xarrow 
      key={ind}
      path="smooth"
      headSize={4}
      zIndex={-1}
      color={"blue"}
      start={reff.ReferencesTableName}
      end={reff.PrimaryKeyTableName}
      dashness={true}
      // dashness={{strokeLen: 10, nonStrokeLen: 15, animation: -2 }}
      curveness={1.0}
      animateDrawing={true}
      />
    );
  })

  const mouseOverTable = () => {
    //see what the table array looks like
    console.log('THIS IS TABLES', tables);
    // loop over the tables array to access each table
    for (let i = 0; i < tables.length; i += 1) {
      //grab that tables id
      const eachTableId = tables[i].props.id;
      console.log('THIS IS THE TABLE ID FROM INSIDE LOOP', tables[1].props, tables[1].props.id)
      //grab the ids of the document
      const documentId = document.getElementById(`${eachTableId}`);
      console.log('THIS IS DOCUMENTID', document.getElementById('public.films'))
      //if the documentId matches the tableId

      console.log('THIS IS ARROWS', xarrows)
      console.log('THIS IS ARROWS KEYS', xarrows[0].props)

      if (xa[i].key === xarrows[i].key) {
        return xarrows[i].props;
      }


      if (documentId === eachTableId) {
        //render the xarrows
        return xarrows;
      } else {
        return xa;
      }
    }
  }

  mouseOverTable();

  const renderArrowsEvent = () => {
    for (let i = 0; i < tables.length; i += 1) {
      const eachTableId = tables[i].props.id;
      const documentId = document.getElementById(`${eachTableId}`);
      // documentId.addEventListener('mouseover', mouseOverTable);

      console.log('THIS IS INSIDE RENDERARROWS', tables[i].key, tables[i].props)
    }
  }

  renderArrowsEvent();

  // function mouseOverTable() {
  //   console.log('THIS IS TABLES', tables)

  // }

  // mouseOverTable();


  /** Truthy when the user is connecting to the database to grab the intial table model */
  if (isLoadingProps) {
    return (
      <div className="canvas-LoadingProps"
        // style={{
        //   textAlign: "center",
        //   fontSize: "18px",
        //   fontFamily: "Geneva",
        //   marginTop: "40px",
        //   marginRight: "225px",
        // }}
      >
        {/* <Text> */}
          Please wait while we process your request.
          <br/>
          <br/>
          <Loader size="xl" variant="dots" />
        {/* </Text> */}
      </div>
    );
  }

  /** Truthy when the user has an issue grabbing the inital table model */
  if (isErrorProps) {
    return (
      <div className="canvas-ErrorProps"
        // style={{
        //   textAlign: "center",
        //   fontSize: "18px",
        //   fontFamily: "Geneva",
        //   marginTop: "40px",
        //   marginRight: "225px",
        // }}
      >
        An error occurred while we processed your request. Please check your
        connection.
      </div>
    );
  }

  /** Truthy when the user is executing the queries for database migration */
  if (isLoading) {
    return (
      <div className="canvas-Loading"
        // style={{
        //   textAlign: "center",
        //   fontSize: "18px",
        //   fontFamily: "Geneva",
        //   marginTop: "40px",
        //   marginRight: "225px",
        // }}
      >
        {/* <Text> */}
        Please wait while we process your request.
        <br />
        <Loader size="xl" variant="dots" />
        {/* </Text> */}
      </div>
    );
  }

  /** Truthy when the user fails to execute the queries for database migration */
  if (isError) {
    return (
      <div className="canvas-IsError"
        // style={{
        //   textAlign: "center",
        //   fontSize: "18px",
        //   fontFamily: "Geneva",
        //   marginTop: "40px",
        //   marginRight: "225px",
        // }}
      >
        An error occurred while we processed your request. Please check your
        connection.
      </div>
    );
  }

  const dbButtons = (
    <div>
      <Group position="right">
        <Button
          styles={(theme) => ({
            root: {
              height: 42,
              paddingLeft: 20,
              paddingRight: 20,
              "&:hover": {
                backgroundColor: theme.fn.darken("#3c4e58", 0.1),
                color: "white",
              },
            },
          })}
        
          id="disconnectButton"
          variant="outline"
          color="dark"
          size="md"
          compact
          leftIcon={<DatabaseOff />}
          onClick={() => {
            sessionStorage.clear();
            DataStore.disconnect();
          }}
        >
          Disconnect database
        </Button>
      </Group>
      <Group position="right">
        <Button
          styles={(theme) => ({
            root: {
              backgroundColor: "#3c4e58",
              color: "white",
              border: 0,
              height: 42,
              paddingLeft: 20,
              paddingRight: 20,
              marginTop: 10,

              "&:hover": {
                backgroundColor: theme.fn.darken("#2b3a42", 0.1),
              },
            },
          })}
          id="executeButton"
          size="md"
          compact
          leftIcon={<DatabaseImport />}
          onClick={() => executeChanges()}
        >
          Execute changes
        </Button>
      </Group>
    </div>
  );

  return (
    // style={{ height: "100%"}}
    <div ref={reference}>
      {Object.keys(fetchedData).length > 0 && DataStore.connectedToDB ? (
        <>
          {dbButtons}
          <div className="canvas-Line311"
            // style={{
            //   display: "flex",
            //   flexFlow: "row wrap",
            //   justifyContent: "space-around",
            //   alignItems: "center",
            // }}
          >
            <Xwrapper>
              {tables}
              {xa}
             {xarrows}
            </Xwrapper>
          </div>
        </>
      ) : Object.keys(fetchedData).length > 0 && DataStore.loadedFile ? (
        <>
          {/* <Group position="right">
            <Button
              color="white"
              leftIcon={<DatabaseImport />}
              onClick={() => setSideBarOpened(true)}
            >
              Connect to DB
            </Button>
          </Group> */}
          {/* <Group position="right">
            <Button id="disconnectButton"
              color="white"
              leftIcon={<DatabaseImport />}
              onClick={() => DataStore.disconnect()}
            >
              Disconnect from DB
            </Button>
          </Group>
          <Group position="right">
            <Button id="executeButton"
              styles={() => ({
                root: {
                  marginTop: 20,
                },
              })}
              color="red"
              leftIcon={<DatabaseImport />}
              onClick={() => executeChanges()}
            >
              Execute changes
            </Button>
          </Group> */}

          <div className="canvas-Line360"
            // style={{
            //   display: "flex",
            //   flexFlow: "row wrap",
            //   justifyContent: "space-around",
            //   alignItems: "center",
            // }}
          >
            <Xwrapper>
              {tables}
              {xa}
            </Xwrapper>
          </div>
        </>
      ) : (
        <>
          {/* "Please Connect to Your Database" */}
          <div className="canvas-ConnectToDatabase" 
          // style={{textAlign: "center", fontSize: "18px", fontFamily: "Geneva", marginTop: "40px", marginRight: "225px"}}
          >
            <h3>Welcome to dbSpy!</h3>
            Please connect your database, upload a SQL file, or build your database from scratch!
          </div>
          {/* <Group position="right">
            <Button
              color="white"
              leftIcon={<DatabaseImport />}
              onClick={() => setSideBarOpened(true)}
            >
              Connect to DB
            </Button>
          </Group> */}
        </>
      )}
    </div>
  );
}
