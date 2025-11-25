import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedTravelDiary = await deploy("TravelDiary", {
    from: deployer,
    log: true,
  });

  console.log(`TravelDiary contract: `, deployedTravelDiary.address);
};
export default func;
func.id = "deploy_travelDiary"; // id required to prevent reexecution
func.tags = ["TravelDiary"];
