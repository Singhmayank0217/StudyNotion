import React from 'react'
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div>
            {/*section 1*/}
            <div className="relative mx-auto flex w-11/12 max-w-maxContent flex-col items-center justify-between gap-8 text-white">
                <Link to={"/signup"}>
                    <div>
                        <div className='text-white'>
                            <p>Become a instructor</p>
                            <FaArrowRight />
                        </div>
                    </div>
                </Link>
            </div>

            {/*section 2*/}

            {/*section 3*/}

            {/*footer*/}

        </div>
    )
}

export default Home
