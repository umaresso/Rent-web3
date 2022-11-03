import React, { useEffect, useState } from "react";
import { Heading, HStack, Text, VStack, Center } from "@chakra-ui/react";
import FilterMenuItem from "./components/FilterMenuItem";
import { useRef } from "react";
import { getProvider } from "@wagmi/core";
import { getProviderOrSigner } from "./data/accountsConnection";
import { getCustomNetworkNFTTrackerContract } from "./data/NftRenting";
import {
  getAllContractAddressess,
  getAllContractTokens,
} from "./data/ipfsStuff";
import { getCustomNetworkERC721Contract, getTokenUri } from "./data/ERC721";
import ContractNFTs from "./components/ContractNFTs";
import NftInformationPopup from "./components/NftInformationPopup";

let NetworkChain = "goerli";
export async function getStaticProps(context) {
  require("dotenv").config();
  return {
    props: { token: process.env.WEB3STORAGE_TOKEN }, // will be passed to the page component as props
  };
}

function Explorecontracts(props) {
  const [currentMenu, setCurrentMenu] = useState("all");
  const [owner, setOwner] = useState();
  //  const [contractAddresses,setContractAddresses]=useState(null);
  const [contractTokens, setContractTokens] = useState(null);
  const [contractTokenURIs, setContractTokenURIs] = useState([]);
  const [selectedNft, setSelectedNft] = useState(null);
  const [NftRentingTracker, setNftRentingTracker] = useState(null);
  let web3ModalRef = useRef();
  // console.log("contract tokens are", contractTokens);

  /**
   *
   * IPFS
   *
   */

  function getAccessToken() {
    return props.token;
  }
  async function storeWithProgress(files) {
    // show the root cid as soon as it's ready
    const onRootCidReady = (cid) => {
      console.log("uploading files with cid:", cid);
    };

    // when each chunk is stored, update the percentage complete and display
    const totalSize = files.map((f) => f.size).reduce((a, b) => a + b, 0);
    let uploaded = 0;

    const onStoredChunk = (size) => {
      uploaded += size;
      const pct = 100 * (uploaded / totalSize);
    };

    const client = makeStorageClient();
    return client.put(files, { onRootCidReady, onStoredChunk });
  }
  async function StoreUpdatedcontractsOnIpfs(contractAddresses) {
    const _blob = new Blob(
      [
        JSON.stringify({
          contracts: [...contractAddresses],
        }),
      ],
      { type: "application/json" }
    );
    const updatedDappInfo = [new File([_blob], `contracts.json`)];
    let newCID = await storeWithProgress(updatedDappInfo);
    return newCID;
  }

  /**      */

  async function init() {
    getProviderOrSigner(NetworkChain, web3ModalRef, true).then((_signer) => {
      _signer?.getAddress().then((_user) => {
        setOwner(_user);
      });
    });
    getCustomNetworkNFTTrackerContract(NetworkChain, web3ModalRef).then(
      async (contract) => {
        getAllContractTokens(contract, setContractTokens).then(
          (contractTokensArray) => {
            let addresses = Object.keys(contractTokensArray);
            addresses?.map(async (adr) => {
              // console.log("address is ", adr);
              getCustomNetworkERC721Contract(
                NetworkChain,
                web3ModalRef,
                adr
              ).then((erc721Contract) => {
                let tokens = contractTokensArray[adr];
                //     console.log("Smart contract at ", adr, " got tokens: ", tokens);
                let tokenUris = [];
                tokens?.map((tokenId, index) => {
                  getTokenUri(erc721Contract, tokenId).then((uri) => {
                    tokenUris.push(uri);
                    if (index + 1 == tokens.length) {
                      // console.log("Token Base URIs got ", tokenUris);
                      let arr = [...contractTokenURIs];
                      let contractInstance = {
                        contractAddress: adr,
                        tokenURIs: tokenUris,
                        tokenIds: tokens,
                      };
                      arr.push(contractInstance);
                      setContractTokenURIs(arr);
                    }
                  });
                });
              });
            });
          }
        );

        setNftRentingTracker(contract);
      }
    );
  }
  function getAccessToken() {
    return props.token;
  }
  function makeStorageClient() {
    return new Web3Storage({ token: getAccessToken() });
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <VStack
        height={contractTokenURIs.length > 0 ? "fit-content" : "100vh"}
        bg="black"
        textColor={"white"}
        width={"100vw"}
      >
        <Center>
          <VStack>
            <Heading
              paddingTop={"10vh"}
              fontSize={"5.5em"}
              width={["80vw", "70vw", "60vw"]}
            >
              Rent yourself a Cool NFT
            </Heading>
            <Text
              fontFamily={"sans-serif"}
              textColor={"grey"}
              fontSize={"18px"}
              width={["80vw", "70vw", "60vw"]}
            >
              RentWeb3 is your favorite place to rent awesome NFTs to use in
              your Next game , for attending an event or hosting your Phenomenal
              event in the Metaverse. We bring you the NFTs from World's best
              creators at affordable prices. So , if you want to be the part of
              the family ,Rent an NFT Now !
            </Text>
          </VStack>
        </Center>

        <HStack spacing={10}>
          <FilterMenuItem
            title={"all"}
            setter={setCurrentMenu}
            isClicked={currentMenu === "all"}
          />
          <FilterMenuItem
            title={"available"}
            setter={setCurrentMenu}
            isClicked={currentMenu === "whitelist"}
          />
          <FilterMenuItem
            title={"rented"}
            setter={setCurrentMenu}
            isClicked={currentMenu === "sale"}
          />
        </HStack>
        <VStack
          align={"left"}
          padding={20}
          width={"100vw"}
          height={"fit-content"}
        >
          {contractTokenURIs &&
            contractTokenURIs.map((ContractInstance) => {
              return (
                <div key={ContractInstance.toString()}>
                  <ContractNFTs
                    selector={setSelectedNft}
                    contract={ContractInstance}
                  />
                </div>
              );
            })}
        </VStack>
      </VStack>
      {selectedNft != null && (
        <NftInformationPopup NFT={selectedNft} displayToggle={selectedNft} />
      )}
    </>
  );
}

export default Explorecontracts;
