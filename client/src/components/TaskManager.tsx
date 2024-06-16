import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Task {
    id: number;
    name: string;
    completed: boolean;
}

Modal.setAppElement('#root');  // Set the app element for accessibility

const TaskManager: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskName, setTaskName] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/tasks');
        setTasks(response.data);
        setLoading(false);
    };

    const addTask = async () => {
        if (taskName.trim() === '') {
            setErrorMessage('Tên công việc không được để trống.');
            return;
        }
        if (tasks.some(task => task.name === taskName)) {
            setErrorMessage('Tên công việc không được trùng.');
            return;
        }
        setErrorMessage('');

        const newTask = { id: Date.now(), name: taskName, completed: false };
        await axios.post('http://localhost:5000/tasks', newTask);
        setTasks([...tasks, newTask]);
        setTaskName('');
        inputRef.current?.focus();
    };

    const toggleTaskCompletion = async (id: number) => {
        const task = tasks.find(task => task.id === id);
        if (task) {
            const updatedTask = { ...task, completed: !task.completed };
            await axios.put(`http://localhost:5000/tasks/${id}`, updatedTask);
            setTasks(tasks.map(task => task.id === id ? updatedTask : task));
        }
    };

    const confirmDeleteTask = (task: Task) => {
        setTaskToDelete(task);
        setModalIsOpen(true);
    };

    const deleteTask = async () => {
        if (taskToDelete) {
            await axios.delete(`http://localhost:5000/tasks/${taskToDelete.id}`);
            setTasks(tasks.filter(task => task.id !== taskToDelete.id));
            closeModal();
        }
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setTaskToDelete(null);
    };

    const deleteCompletedTasks = async () => {
        const completedTasks = tasks.filter(task => task.completed);
        await Promise.all(completedTasks.map(task => axios.delete(`http://localhost:5000/tasks/${task.id}`)));
        setTasks(tasks.filter(task => !task.completed));
    };

    const deleteAllTasks = async () => {
        await Promise.all(tasks.map(task => axios.delete(`http://localhost:5000/tasks/${task.id}`)));
        setTasks([]);
    };

    return (
        <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-4">
            <h1 className="text-2xl font-bold mb-4">Quản lý công việc</h1>
            <input
                type="text"
                className={`border rounded p-2 w-full ${errorMessage ? 'border-red-500' : ''}`}
                placeholder="Nhập tên công việc"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                ref={inputRef}
            />
            {errorMessage && (
                <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
            )}
            <button onClick={addTask} className="bg-blue-500 text-white rounded p-2 w-full mt-2">
                Thêm công việc
            </button>
            <div className="flex justify-around mt-4">
                <button className="border rounded p-2">Tất cả</button>
                <button className="border rounded p-2">Hoàn thành</button>
                <button className="border rounded p-2">Đang thực hiện</button>
            </div>
            <div className="mt-4 max-h-48 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <ul>
                        {tasks.map(task => (
                            <li key={task.id} className="flex items-center justify-between p-2 border-b">
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTaskCompletion(task.id)}
                                    className="mr-2"
                                />
                                <span className={task.completed ? 'line-through' : ''}>{task.name}</span>
                                <div className="flex space-x-2">
                                    <FaEdit className="text-yellow-500 cursor-pointer" />
                                    <FaTrash className="text-red-500 cursor-pointer" onClick={() => confirmDeleteTask(task)} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button onClick={deleteCompletedTasks} className="bg-red-500 text-white rounded p-2 w-full mt-4">
                Xóa công việc hoàn thành
            </button>
            <button onClick={deleteAllTasks} className="bg-red-500 text-white rounded p-2 w-full mt-2">
                Xóa tất cả công việc
            </button>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-20"
                overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-75"
            >
                <h2 className="text-xl font-bold mb-4">Xác nhận</h2>
                <p>Bạn có chắc chắn muốn xóa công việc <strong>{taskToDelete?.name}</strong> không?</p>
                <div className="flex justify-end mt-4">
                    <button onClick={closeModal} className="bg-gray-500 text-white rounded p-2 mr-2">Hủy</button>
                    <button onClick={deleteTask} className="bg-red-500 text-white rounded p-2">Xóa</button>
                </div>
            </Modal>
        </div>
    );
};

export default TaskManager;
