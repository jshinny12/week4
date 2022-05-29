import detectEthereumProvider from "@metamask/detect-provider"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { providers } from "ethers"
import Head from "next/head"
import React, { useState } from "react"
import styles from "../styles/Home.module.css"
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup"
import { FormControl } from '@mui/material';
import * as yup from "yup"
import Button from "@mui/material/Button"



export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet and greet!")
    const [event, setEvent] = useState("Data: N/A");

    async function greet() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()

        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")

        const greeting = "Hello world"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
        } else {
            setLogs("Your anonymous greeting is onchain :)")
            try {
                var data = await response.text();
                console.log(data)
                setEvent(data);
            } catch (err){
                console.log(err);
            }
           
        }
       
    }

    

    const schema = yup.object().shape({
        name: yup.string().required(),
        age: yup.number().positive().required(),
        address: yup.number().positive().required()
    })


    const {register, handleSubmit, formState: {errors}} = useForm({
        mode: 'onSubmit',
        resolver: yupResolver(schema),
    })
    


    const submit = (data : any) => {
        console.log(data);
    }
    


    
    
    return (
        <div className={styles.container}>
            
            <form onSubmit = {handleSubmit(submit)} className={styles.form}>
                <div>
                    <label htmlFor="name" className = {styles.label}> name</label>
                    <input {...register("name")} id ="name" name="name" type="text" className = {styles.input}/>
                    <p> {errors.name?.message} </p>
                </div>
                <div>
                    <label htmlFor="age" className = {styles.label}> age</label>
                    <input {...register("age")} id ="age" name="age" type="text" className = {styles.input}/>
                    <p> {errors.age?.message}</p>

                </div>
                <div>
                    <label htmlFor="address" className = {styles.label}> address</label>
                    <input {...register("address")} id ="address" name="address" type="text" className = {styles.input}/>
                    <p> {errors.address?.message}</p>

                </div>
                <button type="submit" id="submit" className = {styles.buttons}>submit form</button>
            </form>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>

                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <div className={styles.logs}>{logs}</div>

                <div onClick={() => greet()} className={styles.button}>
                    Greet
                    
                </div>
            

            </main>

            <div className = {styles.box}>
                {/* {event.forEach((item) => {
                    <div>{item}</div>
                })} */}
                {/* {event.map((e) => <h3>{e}</h3>)} */}
            <p className = {styles.data}>{event}</p>
                {/* {event.forEach((item) => <h3>{item}</h3>)} */}
      
            </div>
        </div>
    )
}
