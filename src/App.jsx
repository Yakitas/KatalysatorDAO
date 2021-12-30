import { ethers } from "ethers";
import { ThirdwebSDK, VoteModule } from "@3rdweb/sdk";
// eslint-disable-next-line
import { useEffect, useMemo, useState } from "react";
import { useWeb3 } from "@3rdweb/hooks";
import { UnsupportedChainIdError } from "@web3-react/core";

const sdk = new ThirdwebSDK("rinkeby")

//Reference to ERC-1155 contract
const bundleDropModule = sdk.getBundleDropModule(
  "0x246A29D969FC5f43770B6C26C9A4Db105234C4ad"
)

const tokenModule = sdk.getTokenModule(
  "0x8b6ACdB37c18a76673168357c17E10Ea88De5c75"
)

const voteModule = sdk.getVoteModule(
  "0xfb57Ea6a4286a22c535401F6738BD2F88B007ecD"
)

const App = () => {
  //Use connectwallet from Thirdweb
  // eslint-disable-next-line
  const { connectWallet, address, error, provider} = useWeb3()
  console.log('👋 Address:', address)

  //User required to sign transactios to allow write
  const signer = provider ? provider.getSigner() : undefined

  //Check uer have the NFT
  // eslint-disable-next-line
  const [hasClaimedNFT, setHasClaimedNFT] = useState(false)
  // isClaiming lets us easily keep a loading state while the NFT is minting.
  const [isClaiming, setIsClaiming] = useState(false)

  //Holds amount of token of users
  const [memberTokenAmounts, setMemberTokenAmounts] = useState({})
  //Members addresses
  const [memberAddresses, setMemberAddresses] = useState([])
  //To short a wallet address
  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4)
  }
  //Format currency
  const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  //Grabs all the addresses of the members
  useEffect(() => {
    if (!hasClaimedNFT) {
      return
    }

    //Grab users who hold token 0
    bundleDropModule
      .getAllClaimerAddresses("0")
      .then((addresses) => {
        console.log("🚀 Members addresses", addresses)
        setMemberAddresses(addresses)
      })
      .catch((err) => {
        console.error("Failed to get member list", err)
      })
  }, [hasClaimedNFT])

  //Grabs members $ tokens
  useEffect(() => {
    if (!hasClaimedNFT) {
      return
    }

    //Grab balances
    tokenModule
      .getAllHolderBalances()
      .then((amounts) => {
        console.log("👜 Amounts", amounts)
        setMemberTokenAmounts(amounts)
      })
      .catch((err) => {
        console.error("Failed to get token amounts", err)
      })
  }, [hasClaimedNFT])

  //Combine addresses and token amounts
  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      return {
        address,
        tokenAmount: ethers.utils.formatUnits(
          //If address not in memberTokenAmounts then they do not hold the token
          memberTokenAmounts[address] || 0,
          18,
        ),
      }
    })
  }, [memberAddresses, memberTokenAmounts])

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }
    // A simple call to voteModule.getAll() to grab the proposals.
    voteModule
      .getAll()
      .then((proposals) => {
        // Set state!
        setProposals(proposals);
        console.log("🌈 Proposals:", proposals)
      })
      .catch((err) => {
        console.error("failed to get proposals", err);
      });
  }, [hasClaimedNFT]);

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // If we haven't finished retrieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) {
      return;
    }

    // Check if the user has already voted on the first proposal.
    voteModule
      .hasVoted(proposals[0].proposalId, address)
      .then((hasVoted) => {
        setHasVoted(hasVoted);
        if (hasVoted) {
          console.log("🥵 User has already voted")
        }
      })
      .catch((err) => {
        console.error("failed to check if wallet has voted", err);
      });
  }, [hasClaimedNFT, proposals, address]);

  //Another useeffect
  useEffect(() => {
    //Signer to the SDK to interact with contract
    sdk.setProviderOrSigner(signer)
  }, [signer])

  useEffect(() => {
    //Wallet's user not connected than exit
    if (!address) {
      return
    }

    //Check if user has the NFT
    return bundleDropModule
      .balanceOf(address, "0")
      .then((balance) => {
        //balance > 0 then he have the NFT
        if (balance.gt(0)) {
          setHasClaimedNFT(true)
          console.log("🌟 this user has a membership NFT!")
        } else {
          setHasClaimedNFT(false)
          console.log("😭 this user doesn't have a membership NFT.")
        }
      })
      .catch((error) => {
        setHasClaimedNFT(false)
        console.error("failed to nft balance", error)
      })
  }, [address])

  if (error instanceof UnsupportedChainIdError) {
    return (
      <div className="unsupported-network">
        <h2>Sluit uw portemonnee aan op Rinkeby!</h2>
        <p>
          Deze dApp werkt alleen op het Rinkeby-netwerk, schakel netwerken in uw aangesloten portemonnee.
        </p>
      </div>
    )
  }

  //If user's wallet is not connected
  if (!address) {
    return (
      <div className="landing">
        <h1>Welkom in de KatalysatorDAO</h1>
        <button onClick={() => connectWallet("injected")} className="btn-hero">
          Verbind uw portemonnee
        </button>
      </div>
    )
  }

  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>KatalysatorDAO</h1>
        <p>Gefeliciteerd met lid en fan zijn van de Katalysator Development Team, deskundigen van de "Grote Wiem"</p>
        <div>
          <div>
            <h2>Lidmaatschaplijst:</h2>
            <div className="card">
              <table className="contentTable">
                <thead>
                  <tr>
                    <th>Adres</th>
                    <th>Aantal token</th>
                  </tr>
                </thead>
                <tbody>
                  {memberList.map((member) => {
                    return (
                      <tr key={member.address}>
                        <td>{shortenAddress(member.address)}</td>
                        <td>{numberWithCommas(member.tokenAmount)} KATTT</td>
                        {/* <td>{member.tokenAmount} KATTT</td> */}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2>Open Voorstellen:</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                //before we do async things, we want to disable the button to prevent double clicks
                setIsVoting(true)
                // lets get the votes from the form for the values
                const votes = proposals.map((proposal) => {
                  let voteResult = {
                    proposalId: proposal.proposalId,
                    //abstain by default
                    vote: 2,
                  }
                  proposal.votes.forEach((vote) => {
                    const elem = document.getElementById(
                      proposal.proposalId + "-" + vote.type
                    )
                    if (elem.checked) {
                      voteResult.vote = vote.type
                      return
                    }
                  })
                  return voteResult
                })
                // first we need to make sure the user delegates their token to vote
                try {
                  //we'll check if the wallet still needs to delegate their tokens before they can vote
                  const delegation = await tokenModule.getDelegationOf(address)
                  // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                  if (delegation === ethers.constants.AddressZero) {
                    //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                    await tokenModule.delegateTo(address)
                  }
                  // then we need to vote on the proposals
                  try {
                    await Promise.all(
                      votes.map(async (vote) => {
                        // before voting we first need to check whether the proposal is open for voting
                        // we first need to get the latest state of the proposal
                        const proposal = await voteModule.get(vote.proposalId)
                        // then we check if the proposal is open for voting (state === 1 means it is open)
                        if (proposal.state === 1) {
                          // if it is open for voting, we'll vote on it
                          return voteModule.vote(vote.proposalId, vote.vote)
                        }
                        // if the proposal is not open for voting we just return nothing, letting us continue
                        return
                      })
                    )
                    try {
                      // if any of the propsals are ready to be executed we'll need to execute them
                      // a proposal is ready to be executed if it is in state 4
                      await Promise.all(
                        votes.map(async (vote) => {
                          // we'll first get the latest state of the proposal again, since we may have just voted before
                          const proposal = await voteModule.get(
                            vote.proposalId
                          )
                          //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                          if (proposal.state === 4) {
                            return voteModule.execute(vote.proposalId)
                          }
                        })
                      )
                      // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                      setHasVoted(true)
                      // and log out a success message
                      console.log("Successfully voted")
                    } catch (err) {
                      console.error("Failed to execute votes", err)
                    }
                  } catch (err) {
                    console.error("Failed to vote", err)
                  }
                } catch (err) {
                  console.error("Failed to delegate tokens")
                } finally {
                  // in *either* case we need to set the isVoting state to false to enable the button again
                  setIsVoting(false)
                }
              }}
            >
              {proposals.map((proposal, index) => (
                <div key={proposal.proposalId} className="card">
                  <h5>{proposal.description}</h5>
                  <div>
                    {proposal.votes.map((vote) => (
                      <div key={vote.type}>
                        <input
                          type="radio"
                          id={proposal.proposalId + "-" + vote.type}
                          name={proposal.proposalId}
                          value={vote.type}
                          //default the "abstain" vote to checked
                          defaultChecked={vote.type === 2}
                        />
                        <label htmlFor={proposal.proposalId + "-" + vote.type} className="radioLabel">
                          {vote.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button disabled={isVoting || hasVoted} type="submit">
                {isVoting
                  ? "Stemmen..."
                  : hasVoted
                    ? "Je hebt al gestemd"
                    : "Stemmen indienen"}
              </button>
              <small>
                Dit veroorzaakt meerdere transacties die u moet ondertekenen.
              </small>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const mintNft = () => {
    setIsClaiming(true)
    // Call bundleDropModule.claim("0", 1) to mint nft to user's wallet.
    bundleDropModule
      .claim("0", 1)
      .then(() => {
        //set claim state
        setHasClaimedNFT(true)
        //Show user their NFT
        console.log(
          `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
        )
      })
      .catch((err) => {
        console.log("Failed to claim", err)
      })
      .finally(() => {
        //Stop loading state
        setIsClaiming(false)
      })
  }

  //User's wallet is connected
  // return (
  //   <div className="landing">
  //     <h1>Wallet connnected in KatalysatorDAO</h1>
  //   </div>
  // );

  //Render mint NFT screen
  return (
    <div className="mint-nft">
      <h2>Mint jouw gratis</h2>
      <h1>KatalysatorDAO-lidmaatschap NFT</h1>
      <button
        disabled={isClaiming}
        onClick={() => {
          setIsClaiming(true)
          // Call bundleDropModule.claim("0", 1) to mint nft to user's wallet.
          bundleDropModule
            .claim("0", 1)
            .catch((err) => {
              console.error("Failed to claim", err)
              setIsClaiming(false)
            })
            .finally(() => {
              //Stop loading state
              setIsClaiming(false)
              //Set claim state
              setHasClaimedNFT(true)
              //Show user their fancy FNT
              console.log(
                `Successfully Minted! Check it our on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
              )
            })
        }}
      >
        {isClaiming ? "Minting..." : "Mint jouw NFT (Gratis)"}
      </button>
    </div>
  )
};

export default App;
