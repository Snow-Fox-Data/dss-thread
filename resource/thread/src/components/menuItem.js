// import React from 'react';
// // import eventBus from "../eventBus";

// // import { Handle } from 'react-flow-renderer';

// export default memo(({ option }) => {
//   return (
//     <>
//       <Handle
//         type="target"
//         position="left"
//         style={{ background: '#555' }}
//         isConnectable={isConnectable}
//       />
//       <div style={{ border: 'solid 1px #333', borderRadius: '3px', textAlign: 'center', padding: '10px' }}>
//         <div style={{ fontWeight: 'bold' }}>{data.project}</div>
//         <div>
//           {/* <a href={createDsLink2(data.project, data.dataset)} target="_blank">{data.dataset}</a> */}
//           <a href='javascript:void(0)' onClick={selectDataset}>{data.dataset}</a>
//         </div>
//         <div>
//           {data.column}
//         </div>
//       </div>

//       <Handle
//         type="source"
//         position="right"
//         isConnectable={isConnectable}
//       />
//       {/* <Handle
//         type="source"
//         position="right"
//         id="b"
//         style={{ bottom: 10, top: 'auto', background: '#555' }}
//         isConnectable={isConnectable}
//       /> */}
//     </>
//   );
// });